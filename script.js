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
                const lat = getExifData(img, "GPSLatitude");
                const lon = getExifData(img, "GPSLongitude");

                if (lat && lon) {
                    metadata["Latitude"] = lat;
                    metadata["Longitude"] = lon;
                }

                displayMetadata(metadata);
            };
        };

        reader.readAsDataURL(file);
    }

    function getExifData(img, tag) {
        const exif = EXIF.readFromBinaryFile(base64ToArrayBuffer(img.src));
        return exif && exif[tag] ? exif[tag] : "N/A";
    }

    function base64ToArrayBuffer(base64) {
        const binaryString = window.atob(base64.split(",")[1]);
        const length = binaryString.length;
        const bytes = new Uint8Array(length);

        for (let i = 0; i < length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        return bytes.buffer;
    }
});
