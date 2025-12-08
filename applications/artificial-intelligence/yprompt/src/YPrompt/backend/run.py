from apps import create_app
app = create_app()


if __name__ == '__main__':
    app.run(host="0.0.0.0", port=8888, workers=1, auto_reload=True, debug=False)
