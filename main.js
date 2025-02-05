function toggleDropdown(dropdownId) {
    const dropdownContent = document.getElementById(dropdownId);
    if (dropdownContent) {
        dropdownContent.style.display =
            dropdownContent.style.display === "block" ? "none" : "block";
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // Search functionality
    const searchToggle = document.querySelector(".Search-button")
    const searchInput = document.querySelector(".Search-box")
  
    if (searchToggle && searchInput) {
      searchToggle.addEventListener("click", (e) => {
        e.preventDefault()
        if (searchInput.style.display === "none" || searchInput.style.display === "") {
          searchInput.style.display = "block"
          searchInput.focus()
        } else {
          searchInput.style.display = "none"
        }
      })
    } else {
      console.error("Search elements not found")
    }
  
    // Contact form submission
    const contactForm = document.querySelector(".contact-form")
  
    if (contactForm) {
      contactForm.addEventListener("submit", (e) => {
        e.preventDefault()
        console.log("Form submitted")
        // Add your form submission logic here
      })
    } else {
      console.error("Contact form not found")
    }
  })
  
  


  

