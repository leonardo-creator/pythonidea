document.addEventListener("DOMContentLoaded", function () {
    const imageInput = document.getElementById("imageInput");
    const metadataList = document.getElementById("metadataList");
    const processButton = document.getElementById("processButton");
    const statusRadios = document.getElementsByName("status");
    const descriptionInput = document.getElementById("descriptionInput");

    let imageMetadataList = [];

    imageInput.addEventListener("change", function (event) {
        const files = event.target.files;

        if (files.length > 0) {
            clearMetadataList();
            imageMetadataList = [];

            Array.from(files).forEach((file, index) => {
                readImageMetadata(file, index);
            });
        }
    });

    processButton.addEventListener("click", function () {
        const status = getStatusValue();
        const description = descriptionInput.value;

        imageMetadataList.forEach(metadata => {
            metadata.status = status;
            metadata.description = description;
        });

        const jsonMetadata = JSON.stringify(imageMetadataList, null, 2);
        console.log(jsonMetadata);
        alert("Verifique o console para ver o JSON gerado.");
    });

    function clearMetadataList() {
        metadataList.innerHTML = "";
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

        // Exibir as propriedades e os inputs de rádio e texto
        metadataDiv.innerHTML = `<strong>${metadata.name}:</strong>
            <br>
            <strong>Status:</strong> ${metadata.status}
            <br>
            <strong>Descrição:</strong> ${metadata.description || "N/A"}
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

        metadataList.appendChild(listItem);
        listItem.appendChild(metadataDiv);
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
                        name: file.name,
                        status: getStatusValue(),
                        description: descriptionInput.value,
                        "File Size": `${(file.size / 1024).toFixed(2)} KB`,
                        "File Type": file.type,
                        "Last Modified": file.lastModifiedDate.toLocaleDateString(),
                        Latitude: lat ? convertDMSToDD(lat) : "N/A",
                        Longitude: lon ? convertDMSToDD(lon) : "N/A",
                        thumbnail: e.target.result,
                    };

                    imageMetadataList[index] = metadata;
                
