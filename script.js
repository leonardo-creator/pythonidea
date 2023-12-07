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

        // Exibir as propriedades, o status e a descrição
        metadataInfo.innerHTML = `<strong>${metadata.name}:</strong>
            <br>
            <strong>Status:</strong> 
            <select id="status-${metadata.index}">
                <option value="Pendente">Pendente</option>
                <option value="Concluído">Concluído</option>
                <option value="Atrasado">Atrasado</option>
            </select>
            <br>
            <strong>Descrição:</strong> 
            <input type="text" id="description-${metadata.index}" placeholder="Descrição" value="${metadata.description || ""}">
            <br>
            <strong>Data/hora:</strong> ${metadata["Last Modified"]}
            <br>
            <strong>Coordenadas UTM:</strong> ${calculateUTM(metadata.Latitude, metadata.Longitude)}`;

        metadataInfo.addEventListener("change", function () {
            metadata.status = document.getElementById(`status-${metadata.index}`).value;
            metadata.description = document.getElementById(`description-${metadata.index}`).value;
        });

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
                            "Last Modified": file.lastModifiedDate.toLocaleDateString(),
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

        return `UTM X: ${utmEasting.toFixed(3)}, UTM Y: ${utmNorthing.toFixed(3)}`;
    }

    // Add event listener for the "Concluir" button
    const concluirButton = document.getElementById("concluirButton");
    concluirButton.addEventListener("click", function () {
        concluir();
    });

    function resizeImage(img, maxWidth, maxHeight) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Set the canvas size to the maximum dimensions
        canvas.width = maxWidth;
        canvas.height = maxHeight;

        // Draw the image onto the canvas
        ctx.drawImage(img, 0, 0, maxWidth, maxHeight);

        // Convert the canvas back to a data URL
        return canvas.toDataURL('image/jpeg');
    }


    // Function to generate and display JSON
    function concluir() {
        // Create a JSON string from the metadataList
        const jsonContent = JSON.stringify(imageMetadataList, null, 2);

        // Display the JSON content (you can modify this based on your UI)
        console.log("JSON content:\n\n" + jsonContent);

        // Create a div to hold the content
        const container = document.createElement('div');
        container.className = 'document-container'; // Aplica a classe de estilo ao container geral

        // Iterate over each image metadata
        imageMetadataList.forEach(image => {
            // Create a row for each image
            const row = document.createElement('div');
            row.className = 'row';

            // Create the first column for images
            const imgColumn = document.createElement('div');
            imgColumn.className = 'column';

            // Create an image element
            const imgElement = document.createElement('img');
            imgElement.src = image.thumbnail;
            imgElement.className = 'image';
            imgColumn.appendChild(imgElement);

            // Create the second column for information
            const infoColumn = document.createElement('div');
            infoColumn.className = 'column info';
            const infoParagraph = document.createElement('p');
            infoParagraph.textContent = `Name: ${image.name}\nStatus: ${image.status}\nFile Size: ${image["File Size"]}\nFile Type: ${image["File Type"]}\nLast Modified: ${image["Last Modified"]}\nLatitude: ${image.Latitude}\nLongitude: ${image.Longitude}`;
            infoColumn.appendChild(infoParagraph);

            // Append columns to the row
            row.appendChild(imgColumn);
            row.appendChild(infoColumn);

            // Append the row to the container
            container.appendChild(row);
        });

        // Convert the HTML content to Word format using html-docx-js
        const content = container.innerHTML;
        const converted = htmlDocx.asBlob(content);

        // Create a download link
        const link = document.createElement('a');
        link.href = URL.createObjectURL(converted);
        link.download = 'output.docx';

        // Trigger the download
        link.click();
    }


            
    
});


