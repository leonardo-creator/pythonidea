document.addEventListener("DOMContentLoaded", function () {
    const imageInput = document.getElementById("imageInput");
    const metadataList = document.getElementById("metadataList");
    const utmCoordinates = document.getElementById("utmCoordinates");

    let imageMetadataList = [];

    imageInput.addEventListener("change", async function (event) {
        const files = event.target.files;

        if (files.length > 0) {
            clearMetadataList();
            imageMetadataList = [];

            try {
                await Promise.all(Array.from(files).map((file, index) => readImageMetadata(file, index)));
                displayMetadataList();
            } catch (error) {
                console.error(error);
            }
        }
    });

    function clearMetadataList() {
        metadataList.innerHTML = "";
        utmCoordinates.innerHTML = "";
    }

    function displayMetadataList() {
        imageMetadataList.forEach(metadata => {
            displayMetadata(metadata);
        });
    }

    function displayMetadata(metadata) {
        const listItem = document.createElement("li");
        listItem.className = "metadata-item";
    
        // Exibir a foto ao lado das propriedades
        const imgElement = document.createElement("img");
        imgElement.src = metadata.thumbnail;
        listItem.appendChild(imgElement);
    
        const metadataInfo = document.createElement("div");
        metadataInfo.className = "metadata-info";
    
        // Criar e configurar o select para o status
        const statusSelect = document.createElement("select");
        statusSelect.id = `status-${metadata.index}`;
        const statusOptions = ["Pendente", "Concluido", "Atrasado"];
        statusOptions.forEach(status => {
            const option = document.createElement("option");
            option.value = status;
            option.text = status;
            option.selected = status === metadata.status;
            statusSelect.appendChild(option);
        });
    
        // Adicionar ouvinte de evento ao select
        statusSelect.addEventListener("change", function () {
            metadata.status = statusSelect.value;
        });
    
        // Criar e configurar o input para a descrição
        const descriptionInput = document.createElement("input");
        descriptionInput.type = "text";
        descriptionInput.id = `description-${metadata.index}`;
        descriptionInput.placeholder = "Descrição";
        descriptionInput.value = metadata.description || "";
    
        // Adicionar ouvinte de evento ao input
        descriptionInput.addEventListener("change", function () {
            metadata.description = descriptionInput.value;
        });
    
        // Adicionar os elementos ao metadataInfo
        metadataInfo.appendChild(document.createElement("strong").appendChild(document.createTextNode(`${metadata.name}:`)));
        metadataInfo.appendChild(document.createElement("br"));
        metadataInfo.appendChild(document.createElement("strong").appendChild(document.createTextNode("Status:")));
        metadataInfo.appendChild(statusSelect);
        metadataInfo.appendChild(document.createElement("br"));
        metadataInfo.appendChild(document.createElement("strong").appendChild(document.createTextNode("Descrição:")));
        metadataInfo.appendChild(descriptionInput);
        metadataInfo.appendChild(document.createElement("br"));
        metadataInfo.appendChild(document.createElement("strong").appendChild(document.createTextNode("Data/hora:")));
        metadataInfo.appendChild(document.createTextNode(`${metadata["date"]}`));
        metadataInfo.appendChild(document.createElement("br"));
        metadataInfo.appendChild(document.createElement("strong").appendChild(document.createTextNode("Coordenadas UTM:")));
        metadataInfo.appendChild(document.createTextNode(`${calculateUTM(metadata.Latitude, metadata.Longitude)}`));
    
        listItem.appendChild(metadataInfo);
        metadataList.appendChild(listItem);
    }
    

    function readImageMetadata(file, index) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = function (e) {
                const img = new Image();
                img.src = e.target.result;

                img.onload = function () {
                    EXIF.getData(img, function () {
                        const lat = EXIF.getTag(this, "GPSLatitude");
                        const lon = EXIF.getTag(this, "GPSLongitude");

                        const metadata = {
                            index: index,
                            name: file.name,
                            status: "Pendente",
                            description: "",
                            "File Size": `${(file.size / 1024).toFixed(2)} KB`,
                            "File Type": file.type,
                            "date": file.lastModifiedDate.toLocaleString('pt-BR', {
                                year: 'numeric', 
                                month: '2-digit', 
                                day: '2-digit', 
                                hour: '2-digit', 
                                minute: '2-digit', 
                                second: '2-digit'
                            }),                            
                            Latitude: lat ? convertDMSToDD(lat) : "N/A",
                            Longitude: lon ? convertDMSToDD(lon) : "N/A",
                            thumbnail: e.target.result,
                        };

                        imageMetadataList[index] = metadata;
                        resolve();
                    });
                };
            };

            reader.onerror = function (error) {
                reject(error);
            };

            reader.readAsDataURL(file);
        });
    }

    function convertDMSToDD(coord) {
        const degrees = coord[0];
        const minutes = coord[1];
        const seconds = coord[2];

        const dd = degrees + minutes / 60 + seconds / (60 * 60);
        return dd;
    }

    // Função para calcular coordenadas UTM no Brasil
    function calculateUTM(latitude, longitude) {
        proj4.defs("WGS84", "+proj=longlat +datum=WGS84 +no_defs");

        // Determinar a zona UTM com base na latitude
        const zone = 22;
        const hemisferio = -latitude < 0 ? " +south" : ""; // Adiciona +south se a latitude for negativa
        const utmDefinition = `+proj=utm +zone=${zone}${hemisferio} +datum=WGS84 +units=m +no_defs`;
        proj4.defs(`UTM${zone}`, utmDefinition);

        const utm = proj4("WGS84", `UTM${zone}`, [-longitude, -latitude]);

        // Inverter a lógica para longitudes oeste e latitudes sul
        const utmEasting = utm[0];
        const utmNorthing = utm[1];

        return `${utmEasting.toFixed(3)}, ${utmNorthing.toFixed(3)}`;
    }

    // Add event listener for the "Concluir" button
    const concluirButton = document.getElementById("concluirButton");
    concluirButton.addEventListener("click", function () {
        concluir();
    });

    function resizeImage(src, maxWidth, maxHeight) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                // Criar um canvas
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
    
                // Calcular as novas dimensões da imagem mantendo a proporção
                let width = img.width;
                let height = img.height;
    
                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }
    
                // Definir as dimensões do canvas
                canvas.width = width;
                canvas.height = height;
    
                // Desenhar a imagem no canvas
                ctx.drawImage(img, 0, 0, width, height);
    
                // Converter o canvas para uma URL de dados
                resolve(canvas.toDataURL());
            };
            img.onerror = reject;
            img.src = src;
        });
    }
    

function concluir() {
    // Ordenar o imageMetadataList
    imageMetadataList.sort((a, b) => {
        const order = {"Atrasado": 1, "Pendente": 2, "Concluido": 3};
        return order[a.status] - order[b.status];
    });

    console.log(imageMetadataList)

    // Criar um container para o conteúdo
    const container = document.createElement('div');

    // Criar a tag meta para definir a codificação UTF-8
    const metaCharset = document.createElement('meta');
    metaCharset.setAttribute('charset', 'UTF-8');
    container.appendChild(metaCharset);

    // Criar uma tabela para conter as imagens e informações
    const table = document.createElement('table');
    table.style.width = '100%'; // Ajustar conforme necessário

    // Adicionar a tabela ao container
    container.appendChild(table);

    // Processar cada item de metadados de imagem de forma assíncrona
    Promise.all(imageMetadataList.map(async (image) => {
        const row = table.insertRow();

        // Criar a primeira célula para imagens
        const imgCell = row.insertCell();
        const imgElement = document.createElement('img');

        // Redimensionar a imagem e definir a fonte
        const resizedImageSrc = await resizeImage(image.thumbnail, 300, 200); // Exemplo de tamanho: 300x200
        imgElement.src = resizedImageSrc;
        imgElement.style.height = '30px'; // Ajustar conforme necessário
        imgCell.appendChild(imgElement);

        // Criar a segunda célula para informações
        const infoCell = row.insertCell();
        infoCell.innerHTML = `<strong>Titulo:</strong> ${image.index + 1}<br><strong>Nome arquivo:</strong> ${image.name}<br><strong>Data/hora</strong>: ${image.date} <br><strong>Status:</strong> ${image.status}<br><strong>Detalhes:</strong> ${image.description}<br><strong>Coordenadas UTM:</strong><br> ${calculateUTM(image.Latitude, image.Longitude)}`;
    })).then(() => {
        // Após o processamento de todas as imagens
        const content = table.outerHTML;
        const converted = htmlDocx.asBlob(content);

        // Criar um link para download
        const link = document.createElement('a');
        link.href = URL.createObjectURL(converted);
        link.download = 'output.docx';

        // Acionar o download
        link.click();
    });
}


    function escapeSpecialChars(str) {
    const replacements = {
        'Á': '&Aacute;', 'á': '&aacute;',
        'Â': '&Acirc;', 'â': '&acirc;',
        'À': '&Agrave;', 'à': '&agrave;',
        'Ã': '&Atilde;', 'ã': '&atilde;',
        'É': '&Eacute;', 'é': '&eacute;',
        'Ê': '&Ecirc;', 'ê': '&ecirc;',
        'Í': '&Iacute;', 'í': '&iacute;',
        'Ó': '&Oacute;', 'ó': '&oacute;',
        'Ô': '&Ocirc;', 'ô': '&ocirc;',
        'Õ': '&Otilde;', 'õ': '&otilde;',
        'Ú': '&Uacute;', 'ú': '&uacute;',
        'Ç': '&Ccedil;', 'ç': '&ccedil;',
        'º': '&ordm;', 'ª': '&ordf;',
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&apos;'
    };

    return str.replace(/[ÁáÂâÀàÃãÉéÊêÍíÓóÔôÕõÚúÇçºª&<>"']/g, match => replacements[match]);
}


document.getElementById('generate-kml').addEventListener('click', processFiles);

function processFiles() {
    // Supondo que imageMetadataList seja um array de objetos JSON
    const jsonData = imageMetadataList;

    if (jsonData && jsonData.length > 0) {
        processJsonData(jsonData);
    } else {
        alert('Por favor, carregue um arquivo JSON.');
    }
}

async function processJsonData(jsonData) {
    let kmlContent = '<?xml version="1.0" encoding="UTF-8"?>';
    kmlContent += '<kml xmlns="http://www.opengis.net/kml/2.2">';
    kmlContent += '<Document>';

    for (const item of jsonData) {
        const placemark = await createPlacemark(item);
        kmlContent += placemark;
    }

    kmlContent += '</Document></kml>';

    download('incidentes.kml', kmlContent);
}

async function createPlacemark(item) {
    const resizedImageSrc = await resizeImage(item.thumbnail, 300, 200);
    let iconUrl;

    // Selecionando a URL do ícone com base no status
    switch (item.status) {
        case "Atrasado":
            iconUrl = "http://maps.google.com/mapfiles/kml/pushpin/red-pushpin.png";
            break;
        case "Pendente" :
            iconUrl = "http://maps.google.com/mapfiles/kml/pushpin/ylw-pushpin.png";
            break;
        case "Concluido":
            iconUrl = "http://maps.google.com/mapfiles/kml/pushpin/grn-pushpin.png";
            break;
        default:
            iconUrl = "http://maps.google.com/mapfiles/kml/pushpin/blue-pushpin.png";
    }

    return `
    <Placemark>
        <name>${item.index + 1}</name>
        <Style>
            <IconStyle>
                <Icon>
                    <href>${iconUrl}</href> 
                </Icon>
            </IconStyle>
        </Style>
        <description><![CDATA[<p>${item.description}</p><img src="${resizedImageSrc}" />]]></description>
        <Point><coordinates>-${item.Longitude},-${item.Latitude}</coordinates></Point>
    </Placemark>`;
}


function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}


document.getElementById('download-excel').addEventListener('click', downloadExcel);

function downloadExcel() {
    // Suponha que `jsonData` é o seu array de objetos JSON
    const jsonData = imageMetadataList.map(({thumbnail, ...rest}) => rest);

    // Converte o JSON para uma planilha
    const worksheet = XLSX.utils.json_to_sheet(jsonData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Dados");

    // Define as opções de escrita do arquivo
    const wbout = XLSX.write(workbook, {bookType:'xlsx', type:'binary'});

    // Função para converter o conteúdo binário para um Blob
    function s2ab(s) {
        const buf = new ArrayBuffer(s.length);
        const view = new Uint8Array(buf);
        for (let i=0; i<s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
        return buf;
    }

    // Cria um Blob a partir dos dados e cria um link para download
    const blob = new Blob([s2ab(wbout)], {type:"application/octet-stream"});
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dados.xlsx';
    a.click();

    // Limpa o URL criado
    URL.revokeObjectURL(url);
}

    document.getElementById('download-json').addEventListener('click', downloadJson);

    async function downloadJson() {
        
        const jsonData = imageMetadataList; 
    
        // Redimensionar todas as imagens
        const resizedImagesPromises = jsonData.map(async (item) => {
            if (item.thumbnail) {
                const resizedImage = await resizeImage(item.thumbnail, 300, 200); // Use as dimensões desejadas
                return {...item, thumbnail: resizedImage};
            }
            return item;
        });
    
        const resizedJsonData = await Promise.all(resizedImagesPromises);
    
        // Converte os dados em string JSON
        const jsonString = JSON.stringify(resizedJsonData);
    
        // Cria um Blob a partir da string JSON
        const blob = new Blob([jsonString], {type: "application/json"});
    
        // Cria um link para download e aciona o download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'dados.json';
        a.click();
    
        // Limpa o URL criado
        URL.revokeObjectURL(url);
    }

    document.getElementById('imageInput').addEventListener('change', function() {
    if (this.files.length > 0) {
        // Mostrar os botões
        document.getElementById('concluirButton').style.display = 'inline-block';
        document.getElementById('generate-kml').style.display = 'inline-block';
        document.getElementById('download-excel').style.display = 'inline-block';
        document.getElementById('download-json').style.display = 'inline-block';

        // Ocultar o botão de upload
        document.getElementById('upload-label').style.display = 'none';
    }
});

// Restante do seu código JavaScript

    
});
