from flask import Flask, render_template
import pandas as pd

app = Flask(__name__)

@app.route('/')
def home():
    # Carrega uma planilha de exemplo (pode ser substituída pela sua)
    df = pd.read_excel('exemplo.xlsx')
    # Converte o DataFrame para HTML
    table_html = df.to_html(classes='table table-striped', index=False)
    return render_template('index.html', table=table_html)

if __name__ == '__main__':
    app.run(debug=True)
