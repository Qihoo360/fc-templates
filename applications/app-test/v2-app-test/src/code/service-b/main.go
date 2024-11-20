package main

import (
	"fmt"
	"io"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

func main() {
	serviceAUrl := os.Getenv("SERVICE_A_URL")

	r := gin.Default()
	r.GET("/", func(c *gin.Context) {
		resp, err := http.Get(fmt.Sprintf("http://%s", serviceAUrl))
		if err != nil {
			c.String(500, "Error calling Service A: %v", err)
			return
		}
		defer resp.Body.Close()

		body, err := io.ReadAll(resp.Body)
		if err != nil {
			c.String(500, "Error reading Service A response: %v", err)
			return
		}

		c.String(200, "{{.region}}=====>{{.bfunctionName}} |||| Service B received from A: %s", string(body))
	})
	r.Run(":8080")
}
