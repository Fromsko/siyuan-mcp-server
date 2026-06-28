package main

import (
	"flag"
	"log"
	"os"
	"runtime/debug"

	"github.com/Fromsko/siyuan-mcp-server-go/pkg/siyuan"
	"github.com/Fromsko/siyuan-mcp-server-go/pkg/tools"
	"github.com/Fromsko/siyuan-mcp-server-go/pkg/transport"
)

// version is set via ldflags at build time:
//   go build -ldflags="-X main.version=v1.0.0" .
// GoReleaser injects the git tag automatically.
var version = "dev"

func init() {
	// Fallback: detect from Go module build info (go install scenario)
	if version == "dev" {
		if info, ok := debug.ReadBuildInfo(); ok {
			if info.Main.Version != "" && info.Main.Version != "(devel)" {
				version = info.Main.Version
			}
		}
	}
}

func main() {
	mode := flag.String("mode", "stdio", "传输模式: stdio | http")
	addr := flag.String("addr", ":8080", "HTTP 监听地址")
	flag.Parse()

	c := siyuan.NewClient()

	if os.Getenv("DEBUG") != "" {
		log.SetOutput(os.Stderr)
		log.Printf("siyuan-mcp-server-go v%s starting (%s mode)", version, *mode)
		if c.HasToken() {
			log.Printf("SiYuan API: %s (token configured)", c.BaseURL())
		} else {
			log.Printf("⚠ no token configured, limited mode")
		}
	} else {
		log.SetOutput(os.Stderr)
	}

	registry := tools.New(c)
	registry.RegisterAll()

	var srv transport.Server
	switch *mode {
	case "http":
		srv = transport.NewHTTP(*addr)
	default:
		srv = transport.NewStdio()
	}

	if err := srv.Serve(registry, "siyuan-mcp-server", version); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
