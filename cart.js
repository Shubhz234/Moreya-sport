let cart = JSON.parse(localStorage.getItem("cart")) || [];
let couponApplied = false;

const cartContainer = document.getElementById("cart-items-container");
const summarySection = document.getElementById("summary-section");

// Main render function
function renderCart() {
  cartContainer.innerHTML = "";
  if (cart.length === 0) {
    summarySection.style.display = "none";
    cartContainer.innerHTML = `
      <div class="empty-cart">
        <p>Your cart is empty.</p>
        <button onclick="location.href='shop.html'">Browse Products</button>
      </div>
    `;
    return;
  }

  summarySection.style.display = "block";

  cart.forEach((item, index) => {
    const salePrice = item.price * (1 - item.discount / 100);
    const itemTotal = salePrice * item.quantity;

    const div = document.createElement("div");
    div.className = "cart-item";
    div.innerHTML = `
      <img src="${item.image}" alt="${item.name}">
      <div class="info">
        <h3>${item.name}</h3>
        <p>Price: ₹${salePrice.toFixed(0)}</p>
        <div class="quantity">
          <button onclick="updateQty(${index}, -1)">-</button>
          <span>${item.quantity}</span>
          <button onclick="updateQty(${index}, 1)">+</button>
        </div>
      </div>
    `;
    cartContainer.appendChild(div);
  });

  calculateSummary();
}

// Update quantity
function updateQty(index, delta) {
  cart[index].quantity += delta;
  if (cart[index].quantity <= 0) cart.splice(index, 1);
  saveCart();
  renderCart();
}

// Save cart to localStorage
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

// Coupon apply
function applyCoupon() {
  const input = document.getElementById("coupon").value.trim();
  if (input.toLowerCase() === "firstbuy" && !couponApplied) {
    couponApplied = true;
    renderCart();
    alert("Coupon applied: 10% OFF");
  } else if (couponApplied) {
    alert("Coupon already applied");
  } else {
    alert("Invalid coupon");
  }
}

// Calculate pricing summary
function calculateSummary() {
  let subtotal = 0;
  let totalItems = 0;

  cart.forEach(item => {
    const salePrice = item.price * (1 - item.discount / 100);
    subtotal += salePrice * item.quantity;
    totalItems += item.quantity;
  });

  const discount = couponApplied ? subtotal * 0.10 : 0;
  const gst = (subtotal - discount) * 0.05;
  const shipping = totalItems >= 3 ? 0 : 50;

  const total = subtotal - discount + gst + shipping;

  document.getElementById("subtotal").textContent = subtotal.toFixed(0);
  document.getElementById("discount").textContent = discount.toFixed(0);
  document.getElementById("gst").textContent = gst.toFixed(0);
  document.getElementById("shipping").textContent = shipping.toFixed(0);
  document.getElementById("final-total").textContent = total.toFixed(0);
}

// Checkout
function checkout() {
  alert("Order placed successfully!");
  cart = [];
  couponApplied = false;
  saveCart();
  renderCart();
}

renderCart();