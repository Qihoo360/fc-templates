package main

/*
import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
)

const INDEX = `<!DOCTYPE html>
<html>
  <head>
    <title>Powered By Paketo Buildpacks</title>
  </head>
  <body>
    <img style="display: block; margin-left: auto; margin-right: auto; width: 50%;" src="https://paketo.io/images/paketo-logo-full-color.png"></img>
  </body>
</html>`

func main() {
	router := mux.NewRouter()
	router.HandleFunc("/", func(w http.ResponseWriter, req *http.Request) {
		fmt.Fprintln(w, INDEX)
	})

	log.Fatal(http.ListenAndServe(":"+os.Getenv("PORT"), router))
}
*/

// beego
import "github.com/astaxie/beego"

//通过组合的形式在自定义的Controller中将beego.Controller包含，
//这样自定义的Controller就有了Post,Get...等方法，我们只要重写
//Get方法，在Get中写入 "hello world"就可以了
type MainController struct {
	beego.Controller
}

func (this *MainController) Get() {
	this.Ctx.WriteString("hello world")
}

func main() {
	beego.Router("/", &MainController{})
	beego.Run()
}

// gogin
/*
import "github.com/gin-gonic/gin"

func main() {

	r := gin.Default()
	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "Hello world!",
		})
	})
	r.Run() // listen and serve on 0.0.0.0:8080 (for windows "localhost:8080")
}
*/
