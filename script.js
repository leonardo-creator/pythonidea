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
    
        // Process each image metadata asynchronously
        Promise.all(imageMetadataList.map(async (image) => {
            console.log(image)
            const row = table.insertRow();
    
            // Create the first cell for images
            const imgCell = row.insertCell();
            const imgElement = document.createElement('img');
    
            // Resize the image and set the source
            const resizedImageSrc = await resizeImage(image.thumbnail, 300, 200); // Example size: 300x300
            imgElement.src = resizedImageSrc;
            imgElement.style.height = '30px'; // Adjust as needed
            imgCell.appendChild(imgElement);
    
            // Create the second cell for information
            const infoCell = row.insertCell();
            infoCell.innerHTML = `<strong>Titulo:</strong> ${image.index + 1}<br>Data/hora: ${image.date} <br>Status: ${image.status}<br>Descrição: ${image.description}<br> Coordenadas UTM:<br> ${calculateUTM(image.Latitude,image.Longitude)}`;
        })).then(() => {
            // After all images have been processed
            const content = table.outerHTML;
            const converted = htmlDocx.asBlob(content);
    
            // Create a download link
            const link = document.createElement('a');
            link.href = URL.createObjectURL(converted);
            link.download = 'output.docx';
    
            // Trigger the download
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
    const jsonInput = imageMetadataList;

    if (jsonInput.files.length > 0) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const jsonData = JSON.parse(e.target.result);
            processJsonData(jsonData);
        };
        reader.readAsText(jsonInput.files[0]);
    } else {
        alert('Por favor, carregue um arquivo JSON.');
    }
}

function processJsonData(jsonData) {
    let kmlContent = '<?xml version="1.0" encoding="UTF-8"?>';
    kmlContent += '<kml xmlns="http://www.opengis.net/kml/2.2">';
    kmlContent += '<Document>';

    jsonData.forEach(item => {
        kmlContent += createPlacemark(item);
    });

    kmlContent += '</Document></kml>';

    // Aqui você pode, por exemplo, criar um link para download do KML
    download('incidentes.kml', kmlContent);
}

function createPlacemark(item) {
    return `
    <Placemark>
        <name>${item.name}</name>
        <description><![CDATA[<img src="${item.thumbnail}" />${item.description}]]></description>
        <Point><coordinates>${item.Longitude},${item.Latitude}</coordinates></Point>
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
    
});
