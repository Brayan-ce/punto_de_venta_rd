  GNU nano 7.2                                                                   webhook.js                                                                             const http = require("http")
const { exec } = require("child_process")

http.createServer((req, res) => {

  if (req.method === "POST") {
    console.log("GitHub webhook recibido")

    exec("bash /var/www/punto_de_venta_2025/deploy.sh", (err, stdout, stderr) => {
      if (err) {
        console.error("ERROR DEPLOY:", err)
      }
      console.log(stdout)
      console.log(stderr)
    })

    res.end("Deploy ejecutado")
    return
  }

  res.end("Servidor activo")

}).listen(9001)

console.log("Webhook escuchando puerto 9001")