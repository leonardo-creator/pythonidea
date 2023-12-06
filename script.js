document.addEventListener("DOMContentLoaded", function () {
    const imageInput = document.getElementById("imageInput");
    const metadataList = document.getElementById("metadataList");

    imageInput.addEventListener("change", function (event) {
        const file = event.target.files[0];

        if (file) {
            clearMetadataList();

            const metadata = {
                "File Name": file.name,
                "File Size": `${(file.size / 1024).toFixed(2)} KB`,
                "File Type": file.type,
                "Last Modified": file.lastModifiedDate.toLocaleDateString(),
            };

            readImageMetadata(file, metadata);
        }
    });

    function clearMetadataList() {
        metadataList.innerHTML = "";
    }

    function displayMetadata(metadata) {
        for (const key in metadata) {
            const listItem = document.createElement("li");
            listItem.className = "metadata-item";
            listItem.innerHTML = `<strong>${key}:</strong> ${metadata[key]}`;
            metadataList.appendChild(listItem);
        }
    }

    function readImageMetadata(file, metadata) {
        const reader = new FileReader();

        reader.onload = function (e) {
            const img = new Image();
            img.src = e.target.result;

            img.onload = function () {
                // Use a função integrada para obter dados de geolocalização
                navigator.geolocation.getCurrentPosition(
                    function (position) {
                        metadata["Latitude"] = position.coords.latitude;
                        metadata["Longitude"] = position.coords.longitude;
                        displayMetadata(metadata);
                    },
                    function (error) {
                        console.error("Error getting geolocation:", error.message);
                        displayMetadata(metadata);
                    }
                );
            };
        };

        reader.readAsDataURL(file);
    }
});
