document.addEventListener("DOMContentLoaded", function () {
    const imageInput = document.getElementById("imageInput");
    const metadataList = document.getElementById("metadataList");
    const processButton = document.getElementById("processButton");
    const statusInputs = document.getElementById("statusInputs");

    let imageMetadataList = [];

    imageInput.addEventListener("change", function (event) {
        const files = event.target.files;

        if (files.length > 0) {
            clearMetadataList();
            imageMetadataList = [];
            createStatusInputs(files.length);

            Array.from(files).forEach((file, index) => {
                readImageMetadata(file, index);
            });
        }
    });

    processButton.addEventListener("click", function () {
        const jsonMetadata = JSON.stringify(imageMetadataList, null, 2);
        console.log(jsonMetadata);
        alert("Verifique o console para ver o JSON gerado.");
    });

    function clearMetadataList() {
        metadataList.innerHTML = "";
    }

    function createStatusInputs(count) {
        statusInputs.innerHTML = "";

        for (let i = 0; i < count; i++) {
            const statusGroup = document.createElement("div");
            statusGroup.innerHTML = `
                <label for="status-${i}">Status da Foto ${i + 1}:</label>
                <input type="radio" name="status-${i}" id="status-${i}-pendente" value="Pendente" checked /> Pendente
                <input type="radio" name="status-${i}" id="status-${i}-concluido" value="Concluído" /> Concluído
                <input type="radio" name="status-${i}" id="status-${i}-atrasado" value="Atrasado" /> Atrasado
            `;
            statusInputs.appendChild(statusGroup);
        }
    }

    function displayMetadata(metadata) {
        const listItem = document.createElement("li");
        listItem.className = "metadata-item";

        // Exibir a foto ao lado das propriedades
        const imgElement = document.createElement("img");
        imgElement.src = metadata.thumbnail;
        imgElement.style.maxWidth = "100px";
        imgElement.style.maxHeight = "100px";
        listItem.appendChild(imgElement);

        const metadataDiv = document.createElement("div");
        metadataDiv.style.marginLeft = "10px";

        // Exibir as propriedades, o status e o botão de concluir
        metadataDiv.innerHTML = `<strong>${metadata.name}:</strong>
            <br>
            <strong>Status:</strong> ${metadata.status}
            <br>
            <strong>File Size:</strong> ${metadata["File Size"]}
            <br>
            <strong>File Type:</strong> ${metadata["File Type"]}
            <br>
            <strong>Last Modified:</strong> ${metadata["Last Modified"]}
            <br>
            <strong>Latitude:</strong> ${metadata.Latitude}
            <br>
            <strong>Longitude:</strong> ${metadata.Longitude}`;

        const statusButton = document.createElement("button");
        statusButton.textContent = "Concluir";
        statusButton.addEventListener("click", function () {
            // Alterar o status quando o botão é clicado
            metadata.status = getStatusValue(metadata.index);
            displayMetadata(metadata);
        });

        metadataDiv.appendChild(statusButton);
        listItem.appendChild(metadataDiv);

        metadataList.appendChild(listItem);
    }

    function readImageMetadata(file, index) {
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
                        status: getStatusValue(index),
                        "File Size": `${(file.size / 1024).toFixed(2)} KB`,
                        "File Type": file.type,
                        "Last Modified": file.lastModifiedDate.toLocaleDateString(),
                        Latitude: lat ? convertDMSToDD(lat) : "N/A",
                        Longitude: lon ? convertDMSToDD(lon) : "N/A",
                        thumbnail: e.target.result,
                    };

                    imageMetadataList[index] = metadata;
                    displayMetadata(metadata);
                });
            };
        };

        reader.readAsDataURL(file);
    }

    function convertDMSToDD(coord) {
        const degrees = coord[0];
        const minutes = coord[1];
        const seconds = coord[2];

        const dd = degrees + minutes / 60 + seconds / (60 * 60);
        return dd;
    }

    function getStatusValue(index) {
        const statusRadios = document.getElementsByName(`status-${index}`);
        for (const radio of statusRadios) {
            if (radio.checked) {
                return radio.value;
            }
        }
        return "Pendente"; // Valor padrão caso nenhum rádio esteja marcado
    }
});
