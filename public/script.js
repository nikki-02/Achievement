document.addEventListener("DOMContentLoaded", function () {
    fetch("/certificates")
        .then(response => response.json())
        .then(data => {
            const certificateList = document.getElementById("certificate-list");
            data.certificates.forEach(certificate => {
                const row = document.createElement("tr");

                const userCell = document.createElement("td");
                userCell.textContent = certificate.user;
                row.appendChild(userCell);

                const categoryCell = document.createElement("td");
                categoryCell.textContent = certificate.category;
                row.appendChild(categoryCell);

                const typeCell = document.createElement("td");
                typeCell.textContent = certificate.type;
                row.appendChild(typeCell);

                const fileCell = document.createElement("td");
                const fileLink = document.createElement("a");
                fileLink.href = `/uploads/certificates/${certificate.file}`;
                fileLink.textContent = "View Certificate";
                fileCell.appendChild(fileLink);
                row.appendChild(fileCell);

                certificateList.appendChild(row);
            });
        });
});
