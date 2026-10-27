
const form = document.getElementById("recipe-form-element");
const titleInput = document.getElementById("title");
const ingredientsInput = document.getElementById("ingredients");
const instructionsInput = document.getElementById("instructions");
const imageInput = document.getElementById("image");
const imagePreview = document.getElementById("image-preview");
const recipeList = document.getElementById("recipe-list");
const searchInput = document.getElementById("search");
const recipeCount = document.getElementById("recipe-count");
const formHeading = document.getElementById("form-heading");
const saveButton = document.getElementById("save-btn");
const cancelButton = document.getElementById("cancel-btn");
const dialog = document.getElementById("recipe-dialog");
const recipeDetails = document.getElementById("recipe-details");

const STORAGE_KEY = "lab8-recipes";

let recipes = loadRecipes();
let editingId = null;
let selectedImage = "";
let imageError = false;

// Read saved recipes from the browser.
function loadRecipes() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        const parsed = saved ? JSON.parse(saved) : [];

        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error("Could not load recipes:", error);
        return [];
    }
}

// Save recipes to LocalStorage.
function saveRecipes() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
        return true;
    } catch (error) {
        alert("Storage is full. Try using a smaller image.");
        return false;
    }
}

// Safely display user-provided text as HTML.
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });
}

// Display recipes and apply search.
function displayRecipes() {
    const searchTerm = searchInput.value.trim().toLowerCase();

    const filteredRecipes = recipes.filter(function (recipe) {
        return recipe.title.toLowerCase().includes(searchTerm) ||
            recipe.ingredients.toLowerCase().includes(searchTerm);
    });

    recipeCount.textContent = recipes.length;
    recipeList.innerHTML = "";

    if (filteredRecipes.length === 0) {
        recipeList.innerHTML = `
            <div class="empty-state">
                <h3>No recipes found</h3>
                <p>Try another search or add your first recipe!</p>
            </div>
        `;
        return;
    }

    filteredRecipes.forEach(function (recipe) {
        const card = document.createElement("article");
        card.className = "recipe-card";

        const imageHTML = recipe.image
            ? `<img class="recipe-image"
                 src="${recipe.image}"
                 alt="${escapeHTML(recipe.title)}">`
            : `<div class="recipe-image"
                 role="img" aria-label="No recipe image"
                 style="display:flex;align-items:center;
                 justify-content:center;color:#28634f;">
                 No image added
               </div>`;

        card.innerHTML = `
            ${imageHTML}
            <div class="recipe-content">
                <h3>${escapeHTML(recipe.title)}</h3>
                <p>${escapeHTML(
                    recipe.ingredients.length > 120
                        ? recipe.ingredients.slice(0, 120) + "..."
                        : recipe.ingredients
                )}</p>
                <div class="card-actions">
                    <button class="action-btn"
                        data-action="view" data-id="${recipe.id}">
                        View
                    </button>
                    <button class="action-btn"
                        data-action="edit" data-id="${recipe.id}">
                        Edit
                    </button>
                    <button class="action-btn delete-btn"
                        data-action="delete" data-id="${recipe.id}">
                        Delete
                    </button>
                </div>
            </div>
        `;

        recipeList.appendChild(card);
    });
}

// Preview the selected image.
imageInput.addEventListener("change", function () {
    imageError = false;
    selectedImage = "";

    const file = imageInput.files[0];

    if (!file) {
        imagePreview.hidden = true;
        imagePreview.removeAttribute("src");
        return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type) || file.size > 2 * 1024 * 1024) {
        imageError = true;
        alert("Choose a JPG, PNG or WebP image under 2 MB.");
        imageInput.value = "";
        imagePreview.hidden = true;
        return;
    }

    const reader = new FileReader();

    reader.onload = function () {
        selectedImage = reader.result;
        imagePreview.src = selectedImage;
        imagePreview.hidden = false;
    };

    reader.onerror = function () {
        imageError = true;
        alert("Could not read this image. Please try another.");
    };

    reader.readAsDataURL(file);
});

// CREATE or UPDATE a recipe.
form.addEventListener("submit", function (event) {
    event.preventDefault();

    if (imageError) {
        alert("Please select a valid image or remove the image selection.");
        return;
    }

    const title = titleInput.value.trim();
    const ingredients = ingredientsInput.value.trim();
    const instructions = instructionsInput.value.trim();

    if (!title || !ingredients || !instructions) {
        alert("Please complete all required fields.");
        return;
    }

    if (imageInput.files.length > 0 && !selectedImage) {
        alert("Please wait for the image to finish loading.");
        return;
    }

    if (editingId !== null) {
        const index = recipes.findIndex(function (recipe) {
            return recipe.id === editingId;
        });

        if (index === -1) {
            alert("Recipe not found. Please try again.");
            resetForm();
            return;
        }

        const updatedRecipe = {
            ...recipes[index],
            title: title,
            ingredients: ingredients,
            instructions: instructions,
            image: imageInput.files.length > 0
                ? selectedImage
                : recipes[index].image
        };

        const oldRecipe = recipes[index];
        recipes[index] = updatedRecipe;

        if (!saveRecipes()) {
            recipes[index] = oldRecipe;
            return;
        }

        alert("Recipe updated successfully!");
    } else {
        const newRecipe = {
            id: crypto.randomUUID(),
            title: title,
            ingredients: ingredients,
            instructions: instructions,
            image: selectedImage
        };

        recipes.unshift(newRecipe);

        if (!saveRecipes()) {
            recipes.shift();
            return;
        }

        alert("Recipe added successfully!");
    }

    resetForm();
    displayRecipes();
});

// READ: view a recipe's complete details.
function viewRecipe(id) {
    const recipe = recipes.find(function (item) {
        return item.id === id;
    });

    if (!recipe) return;

    recipeDetails.innerHTML = `
        <p class="eyebrow">RECIPE DETAILS</p>
        <h2>${escapeHTML(recipe.title)}</h2>
        ${recipe.image
            ? `<img class="dialog-image"
                 src="${recipe.image}"
                 alt="${escapeHTML(recipe.title)}">`
            : ""}
        <h3>Ingredients</h3>
        <p class="dialog-text">${escapeHTML(recipe.ingredients)}</p>
        <h3>Instructions</h3>
        <p class="dialog-text">${escapeHTML(recipe.instructions)}</p>
    `;

    dialog.showModal();
}

// UPDATE: load the chosen recipe into the form.
function editRecipe(id) {
    const recipe = recipes.find(function (item) {
        return item.id === id;
    });

    if (!recipe) return;

    editingId = id;
    titleInput.value = recipe.title;
    ingredientsInput.value = recipe.ingredients;
    instructionsInput.value = recipe.instructions;

    selectedImage = recipe.image || "";
    imageError = false;
    imageInput.value = "";

    if (selectedImage) {
        imagePreview.src = selectedImage;
        imagePreview.hidden = false;
    } else {
        imagePreview.hidden = true;
        imagePreview.removeAttribute("src");
    }

    formHeading.textContent = "Edit Recipe";
    saveButton.textContent = "Update Recipe";
    cancelButton.hidden = false;

    document.getElementById("recipe-form").scrollIntoView({
        behavior: "smooth"
    });
}

// DELETE: remove a recipe after confirmation.
function deleteRecipe(id) {
    const recipe = recipes.find(function (item) {
        return item.id === id;
    });

    if (!recipe) return;

    if (!confirm(`Are you sure you want to delete "${recipe.title}"?`)) {
        return;
    }

    const previousRecipes = recipes;
    recipes = recipes.filter(function (item) {
        return item.id !== id;
    });

    if (!saveRecipes()) {
        recipes = previousRecipes;
        return;
    }

    if (editingId === id) {
        resetForm();
    }

    displayRecipes();
}

// Handle View, Edit and Delete button clicks.
recipeList.addEventListener("click", function (event) {
    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const id = button.dataset.id;
    const action = button.dataset.action;

    if (action === "view") viewRecipe(id);
    if (action === "edit") editRecipe(id);
    if (action === "delete") deleteRecipe(id);
});

// Reset the form after saving or cancelling an edit.
function resetForm() {
    form.reset();
    editingId = null;
    selectedImage = "";
    imageError = false;

    imagePreview.hidden = true;
    imagePreview.removeAttribute("src");

    formHeading.textContent = "Create a New Recipe";
    saveButton.textContent = "Save Recipe";
    cancelButton.hidden = true;
}

cancelButton.addEventListener("click", resetForm);

document.getElementById("close-dialog").addEventListener("click", function () {
    dialog.close();
});

dialog.addEventListener("click", function (event) {
    if (event.target === dialog) {
        dialog.close();
    }
});

// Search recipes as the user types.
searchInput.addEventListener("input", displayRecipes);

// Show saved recipes when the page opens.
displayRecipes();
