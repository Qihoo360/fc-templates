package main

import (
	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()
	r.GET("/", func(c *gin.Context) {
		c.String(200, "Hello, I am service A! my name is {{.afunctionName}}, I am come from {{.region}}")
	})
	r.Run(":8080")
}
