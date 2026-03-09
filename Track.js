document.addEventListener("DOMContentLoaded",() => {

const track = document.querySelector(".track");
const slides = document.querySelectorAll(".slide");
const nextBtn = document.querySelectorAll(".next");
const prevBtn = document.querySelectorAll(".prev");

let index =0;
const total = slides.length;

track.style.transform = `translateX(-${index * 100}%)`;

nextBtn.forEach(btn => btn.addEventListener("click", () => {
	index++;
	if (index >= total) {
		index = 0;
	}
	track.style.transform = `translateX(-${index * 100}%)`;
}));

prevBtn.forEach(btn => btn.addEventListener("click", () => {
	index--;
	if (index < 0) {
		index = total - 1;
	}
	track.style.transform = `translateX(-${index * 100}%)`;
}));
});

//manages the slideshow function that allows us to change the primary active module or "viewport"