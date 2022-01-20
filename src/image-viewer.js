// Get the modal
let modal = document.getElementById("image-modal");

// Get blog post images
let images = document.getElementById("blog").getElementsByTagName("img");

// Get close modal button
let button = document.getElementById("image-modal-content-box").getElementsByClassName("close")[0];

// When user clicks a post image, open the modal 
for (let image of images) 
    image.onclick = () => {
        modal.style.display = "block";
        let modal_image = modal.getElementsByTagName("img")[0];
        modal_image.src = image.src;
    };

// When user clicks close button, close the modal
button.onclick = () => {
    modal.style.display = "none";
};

// When user clicks outside of image viewer, close it
window.onclick = (event) => {
    if (event.target == modal)
        modal.style.display = "none";
};