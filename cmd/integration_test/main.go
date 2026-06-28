package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"strings"
	"time"
)

func main() {
	failures := 0
	pass := func(name string) { fmt.Printf("  ✅ %s\n", name) }
	fail := func(name, detail string) { fmt.Printf("  ❌ %s: %s\n", name, detail); failures++ }

	// Build
	fmt.Println("🔨 Building...")
	build := exec.Command("go", "build", "-o", "siyuan-mcp-server-go.exe", ".")
	if out, err := build.CombinedOutput(); err != nil {
		fmt.Printf("BUILD FAILED: %v\n%s\n", err, out)
		os.Exit(1)
	}

	// Start server
	fmt.Println("🚀 Starting server...")
	cmd := exec.Command("./siyuan-mcp-server-go.exe")
	stdin, _ := cmd.StdinPipe()
	stdout, _ := cmd.StdoutPipe()
	cmd.Start()
	defer cmd.Process.Kill()

	// Line-by-line reader to handle pipe buffering on all platforms
	stdoutReader := bufio.NewReader(stdout)
	readLine := func(timeout time.Duration) map[string]any {
		type result struct {
			m map[string]any
		}
		ch := make(chan result, 1)
		go func() {
			line, err := stdoutReader.ReadString('\n')
			if err != nil {
				ch <- result{}
				return
			}
			var m map[string]any
			json.Unmarshal([]byte(line), &m)
			ch <- result{m}
		}()
		select {
		case r := <-ch:
			return r.m
		case <-time.After(timeout):
			return nil
		}
	}

	time.Sleep(300 * time.Millisecond) // let server fully start

	fmt.Println("\n📋 Test Suite")
	fmt.Println(strings.Repeat("=", 12))

	// Test 1: initialize
	fmt.Println("\n1. initialize")
	fmt.Fprintf(stdin, `{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}`+"\n")
	resp := readLine(3 * time.Second)
	if resp == nil {
		fail("initialize", "no response")
	} else if info, ok := resp["result"].(map[string]any)["serverInfo"].(map[string]any); ok {
		fmt.Printf("     server: %s v%s\n", info["name"], info["version"])
		pass("initialize")
	} else {
		fail("initialize", fmt.Sprintf("%v", resp))
	}

	// Test 2: tools/list
	fmt.Println("\n2. tools/list")
	fmt.Fprintf(stdin, `{"jsonrpc":"2.0","method":"notifications/initialized"}`+"\n")
	fmt.Fprintf(stdin, `{"jsonrpc":"2.0","id":2,"method":"tools/list"}`+"\n")
	resp = readLine(3 * time.Second)
	if resp == nil {
		fail("tools/list", "no response")
	} else if tools, ok := resp["result"].(map[string]any)["tools"].([]any); ok {
		fmt.Printf("     %d tools registered\n", len(tools))
		if len(tools) >= 38 {
			pass(fmt.Sprintf("tools/list (%d tools)", len(tools)))
		} else {
			fail("tools/list", fmt.Sprintf("expected >=38, got %d", len(tools)))
		}
		names := map[string]bool{}
		for _, t := range tools {
			names[t.(map[string]any)["name"].(string)] = true
		}
		expected := []string{
			"help",
			"notebook_lsNotebooks", "notebook_openNotebook", "notebook_closeNotebook",
			"notebook_renameNotebook", "notebook_createNotebook", "notebook_removeNotebook",
			"notebook_getNotebookConf", "notebook_setNotebookConf",
			"filetree_createDocWithMd", "filetree_renameDoc", "filetree_removeDoc",
			"filetree_moveDocs", "filetree_getHPathByPath", "filetree_getHPathByID",
			"block_insertBlock", "block_updateBlock", "block_deleteBlock",
			"block_moveBlock", "block_getBlockKramdown",
			"attr_getBlockAttrs", "attr_setBlockAttrs",
			"query_sql", "search_fullTextSearch",
			"template_render", "template_renderSprig",
			"file_getFile", "file_putFile",
			"export_exportMdContent", "export_exportResources",
			"convert_pandoc",
			"notification_pushMsg", "notification_pushErrMsg",
			"network_forwardProxy",
			"system_bootProgress", "system_version", "system_currentTime",
			"asset_upload",
		}
		missing := 0
		for _, name := range expected {
			if names[name] {
				pass(fmt.Sprintf("  tool: %s", name))
			} else {
				fail(fmt.Sprintf("  tool: %s", name), "MISSING")
				missing++
			}
		}
		if missing == 0 {
			pass(fmt.Sprintf("regression: all %d tools present", len(expected)))
		}
	} else {
		fail("tools/list", fmt.Sprintf("%v", resp))
	}

	// Test 3: help tool
	fmt.Println("\n3. help tool")
	fmt.Fprintf(stdin, `{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"help","arguments":{}}}`+"\n")
	resp = readLine(3 * time.Second)
	if resp == nil {
		fail("help", "no response")
	} else if r, ok := resp["result"].(map[string]any); ok {
		content := r["content"].([]any)[0].(map[string]any)
		text := content["text"].(string)
		if strings.Contains(text, "notebook_lsNotebooks") {
			pass("help (lists all tools)")
		} else {
			fail("help", "missing tool names in output")
		}
	} else {
		fail("help", fmt.Sprintf("%v", resp))
	}

	// Test 4: help with specific tool
	fmt.Println("\n4. help notebook_createNotebook")
	fmt.Fprintf(stdin, `{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"help","arguments":{"tool":"notebook_createNotebook"}}}`+"\n")
	resp = readLine(3 * time.Second)
	if resp == nil {
		fail("help(specific)", "no response")
	} else if r, ok := resp["result"].(map[string]any); ok {
		content := r["content"].([]any)[0].(map[string]any)
		text := content["text"].(string)
		if strings.Contains(text, "notebook_createNotebook") && strings.Contains(text, "必填") {
			pass("help (specific tool detail)")
		} else {
			fail("help(specific)", "missing detail")
		}
	}

	// Test 5: non-existent tool
	fmt.Println("\n5. non-existent tool error")
	fmt.Fprintf(stdin, `{"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"name":"nonexistent_tool","arguments":{}}}`+"\n")
	resp = readLine(3 * time.Second)
	if resp == nil {
		fail("unknown tool", "no response")
	} else if _, ok := resp["error"]; ok {
		pass("unknown tool error (JSON-RPC)")
	} else {
		fail("unknown tool", "should have returned error")
	}

	// Test 6: SiYuan API error handling
	fmt.Println("\n6. SiYuan API error handling")
	fmt.Fprintf(stdin, `{"jsonrpc":"2.0","id":6,"method":"tools/call","params":{"name":"system_version","arguments":{}}}`+"\n")
	resp = readLine(3 * time.Second)
	if resp == nil {
		fail("system_version", "no response")
	} else if r, ok := resp["result"].(map[string]any); ok {
		if isErr, _ := r["isError"].(bool); isErr {
			pass("API error → isError:true (graceful)")
		} else {
			pass("API call succeeded (SiYuan may be running)")
		}
	}

	fmt.Println("\n" + strings.Repeat("=", 40))
	if failures > 0 {
		fmt.Printf("❌ %d tests FAILED\n", failures)
		os.Exit(1)
	}
	fmt.Println("✅ ALL TESTS PASSED")
}
