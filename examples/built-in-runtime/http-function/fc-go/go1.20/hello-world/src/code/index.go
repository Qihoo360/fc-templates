package function

import (
	"context"
	"fmt"
	"net/http"
	"strings"
)

// Handle an HTTP Request.
func handler(ctx context.Context, res http.ResponseWriter, req *http.Request) {
	/*
	 * YOUR CODE HERE
	 *
	 */

	fmt.Println("Received request")
	fmt.Println(prettyPrint(req))      // echo to local output
	// fmt.Fprintf(res, prettyPrint(req)) // echo to caller
	fmt.Fprintf(res, "Hello, world!") // echo to caller
}

func prettyPrint(req *http.Request) string {
	b := &strings.Builder{}
	fmt.Fprintf(b, "%v %v %v %v\n", req.Method, req.URL, req.Proto, req.Host)
	for k, vv := range req.Header {
		for _, v := range vv {
			fmt.Fprintf(b, "  %v: %v\n", k, v)
		}
	}

	if req.Method == "POST" {
		req.ParseForm()
		fmt.Fprintln(b, "Body:")
		for k, v := range req.Form {
			fmt.Fprintf(b, "  %v: %v\n", k, v)
		}
	}

	return b.String()
}
