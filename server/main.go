package main

import (
	"embed"
	"flag"
	"fmt"
	"io"
	"io/fs"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

//go:embed build/static
var embedFs embed.FS

const WRITE_PACK_SIZE = 1 * 1024 * 1024 // 1MB

var (
	host string
	port int
	buf  = make([]byte, WRITE_PACK_SIZE)
)

func init() {
	flag.StringVar(&host, "host", "0.0.0.0", "Host to listen")
	flag.IntVar(&port, "port", 3322, "Port to listen")
}

// ---------- API HANDLERS ----------

func pingHandler(c *gin.Context) {
	c.JSON(200, gin.H{"message": "pong"})
}

func downloadHandler(c *gin.Context) {
	count, _ := strconv.Atoi(c.DefaultQuery("count", "8"))
	c.Header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
	c.Header("Content-Disposition", "attachment; filename=random.dat")
	c.Header("Content-Transfer-Encoding", "binary")
	c.Status(200)
	writer := c.Writer
	for i := 0; i < count; i++ {
		if _, err := writer.Write(buf); err != nil {
			break
		}
		writer.Flush()
	}
}

func uploadHandler(c *gin.Context) {
	// _, err := io.Copy(io.Discard, c.Request.Body)
	// if err != nil {
	// 	c.String(500, "upload error")
	// 	return
	// }
	io.Copy(io.Discard, c.Request.Body)
	c.Status(200)
}

func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE, PATCH")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Content-Length, Accept, Authorization")
		c.Header("Access-Control-Expose-Headers", "Content-Disposition")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}

// ---------- 静态资源中间件 ----------

func StaticEmbedMiddleware(embedFs embed.FS) gin.HandlerFunc {
	fsys, _ := fs.Sub(embedFs, "build/static")
	fileServer := http.FileServer(http.FS(fsys))
	return func(c *gin.Context) {
		// 只考虑 GET/HEAD，其他（如POST/api）不处理静态
		if c.Request.Method != "GET" && c.Request.Method != "HEAD" {
			c.Next()
			return
		}
		filePath := strings.TrimPrefix(c.Request.URL.Path, "/")
		if filePath == "" {
			filePath = "index.html"
		}
		if f, err := fsys.Open(filePath); err == nil {
			f.Close()
			fileServer.ServeHTTP(c.Writer, c.Request)
			c.Abort()
			return
		}
		c.Next()
	}
}

// ---------------- MAIN -----------------------

func main() {
	flag.Parse()

	r := gin.Default()
	r.Use(CORSMiddleware())
	r.Use(StaticEmbedMiddleware(embedFs)) // 静态优先

	r.GET("/api/ping", pingHandler)
	r.GET("/api/download", downloadHandler)
	r.POST("/api/upload", uploadHandler)

	addr := fmt.Sprintf("%s:%d", host, port)
	fmt.Printf("Starting server on %s...\n", addr)
	if err := r.Run(addr); err != nil {
		panic(err)
	}
}
