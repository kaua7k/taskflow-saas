from flask import Flask, render_template
import os
from whitenoise import WhiteNoise

# Define o caminho base do projeto
base_dir = os.path.abspath(os.path.dirname(__file__))

app = Flask(__name__, 
            static_folder=os.path.join(base_dir, 'static'),
            template_folder=os.path.join(base_dir, 'templates'))

# Configura o WhiteNoise para servir arquivos estáticos
app.wsgi_app = WhiteNoise(app.wsgi_app, root=os.path.join(base_dir, 'static/'), prefix='static/')

@app.route("/")
def home():
    return render_template("index.html")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
