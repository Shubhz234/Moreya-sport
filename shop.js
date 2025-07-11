const products = [
  {
    id: "bat001",
    name: "Cricket Bat",
    price: 1800,
    discount: 10,
    image: "https://i.postimg.cc/3N6XfjxH/images-6.jpg"
  },
  {
    id: "ball001",
    name: "Cricket Ball",
    price: 500,
    discount: 5,
    image: "https://i.postimg.cc/xCPYPggc/images-7.jpg"
  },
  {
    id: "tee001",
    name: "Cricket T-Shirt",
    price: 799,
    discount: 10,
    image: "https://i.postimg.cc/fW2QTVPn/images-8.jpg"
  },
  {
    id: "shoe001",
    name: "Cricket Shoes",
    price: 2500,
    discount: 10,
    image: "https://i.postimg.cc/0j34Gwgz/jaffa-n.jpg"
  },
  {
    id: "track001",
    name: "Track Pants",
    price: 999,
    discount: 10,
    image: "https://i.postimg.cc/7YSv1K6D/images-9.jpg"
  }
];

const grid = document.getElementById("productGrid");
const priceFilter = document.getElementById("priceFilter");
const searchInput = document.getElementById("searchInput");

// Render products
function renderProducts(productList) {
  grid.innerHTML = "";
  productList.forEach(product => {
    const salePrice = (product.price * (1 - product.discount / 100)).toFixed(0);

    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}">
      <h3>${product.name}</h3>
      <p><strong>₹${salePrice}</strong><span class="strike">₹${product.price}</span></p>
      <button onclick="addToCart('${product.id}', '${product.name}', ${product.price}, ${product.discount}, '${product.image}')">
        Add to Cart
      </button>
    `;
    grid.appendChild(card);
  });
}

// Filter by price
priceFilter.addEventListener("change", () => {
  let sorted = [...products];

  if (priceFilter.value === "low") {
    sorted.sort((a, b) => a.price * (1 - a.discount / 100) - b.price * (1 - b.discount / 100));
  } else if (priceFilter.value === "high") {
    sorted.sort((a, b) => b.price * (1 - b.discount / 100) - a.price * (1 - a.discount / 100));
  }

  renderProducts(sorted);
});

// Search
searchInput.addEventListener("input", () => {
  const value = searchInput.value.toLowerCase();
  const filtered = products.filter(p => p.name.toLowerCase().includes(value));
  renderProducts(filtered);
});

// Add to Cart
function addToCart(id, name, price, discount, image) {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  const existing = cart.find(item => item.id === id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id,
      name,
      price,
      discount,
      image,
      quantity: 1
    });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
}

// Update Cart Count
function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.getElementById("cart-count").textContent = count;
}

renderProducts(products);
updateCartCount();