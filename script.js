document.addEventListener("DOMContentLoaded", function () {
    const imageInput = document.getElementById("imageInput");
    const metadataList = document.getElementById("metadataList");
    const processButton = document.getElementById("processButton");

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
        listItem.innerHTML = `<strong>${metadata.name}:</strong> ${JSON.stringify(metadata, null, 2)}`;
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
                        name: file.name,
                        "File Size": `${(file.size / 1024).toFixed(2)} KB`,
                        "File Type": file.type,
                        "Last Modified": file.lastModifiedDate.toLocaleDateString(),
                        Latitude: lat ? convertDMSToDD(lat) : "N/A",
                        Longitude: lon ? convertDMSToDD(lon) : "N/A"
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
});
