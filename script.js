// === Имитация "бэкенда" через localStorage ===
// Ключи для хранения данных
const LS_KEYS = {
    dishes: 'dishes',
    products: 'products',
    categories: 'categories',
};

// --- Утилиты для работы с localStorage ---
function saveToLS(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}
function loadFromLS(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
}

// --- Начальные данные (если пусто) ---
function initData() {
    if (!localStorage.getItem(LS_KEYS.categories)) {
        saveToLS(LS_KEYS.categories, [
            { id: genId(), name: 'Основное' },
            { id: genId(), name: 'Супы' },
            { id: genId(), name: 'Десерты' },
        ]);
    }
    if (!localStorage.getItem(LS_KEYS.products)) {
        saveToLS(LS_KEYS.products, []);
    }
    if (!localStorage.getItem(LS_KEYS.dishes)) {
        saveToLS(LS_KEYS.dishes, []);
    }
}

// --- Генерация уникального id ---
function genId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

// === DOM-элементы ===
const tabs = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const notification = document.getElementById('notification');

// --- Модальные окна ---
const modals = {
    dish: document.getElementById('dish-modal'),
    product: document.getElementById('product-modal'),
    category: document.getElementById('category-modal'),
    confirm: document.getElementById('confirm-modal'),
};

// --- Формы ---
const forms = {
    dish: document.getElementById('dish-form'),
    product: document.getElementById('product-form'),
    category: document.getElementById('category-form'),
};

// --- Списки и контролы ---
const dishesList = document.getElementById('dishes-list');
const productsList = document.getElementById('products-list');
const categoriesList = document.getElementById('categories-list');
const filterCategory = document.getElementById('filter-category');
const searchDish = document.getElementById('search-dish');
const searchProduct = document.getElementById('search-product');

// === Состояние приложения ===
let dishes = [];
let products = [];
let categories = [];
let currentEdit = { type: null, id: null };
let filter = { category: '', search: '' };

// === Инициализация ===
initData();
loadAll();
renderAll();

// === Навигация по вкладкам ===
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        tabContents.forEach(tc => tc.classList.remove('active'));
        document.getElementById(tab.dataset.tab).classList.add('active');
    });
});

// === Загрузка данных из localStorage ===
function loadAll() {
    dishes = loadFromLS(LS_KEYS.dishes);
    products = loadFromLS(LS_KEYS.products);
    categories = loadFromLS(LS_KEYS.categories);
}

// === Рендер всех списков ===
function renderAll() {
    renderCategoriesList();
    renderProductsList();
    renderDishesList();
    renderCategoryOptions();
}

// === Рендер списка блюд ===
function renderDishesList() {
    let filtered = dishes.filter(dish => {
        const byCat = !filter.category || dish.category === filter.category;
        const bySearch = !filter.search || dish.name.toLowerCase().includes(filter.search.toLowerCase());
        return byCat && bySearch;
    });
    dishesList.innerHTML = filtered.length ? filtered.map(dishCard).join('') : '<div style="color:#888">Нет блюд</div>';
}

// --- Генерация HTML карточки блюда ---
function dishCard(dish) {
    const cat = categories.find(c => c.id === dish.category)?.name || '';
    return `<div class="card">
        ${dish.image ? `<img src="${dish.image}" alt="">` : ''}
        <div class="category">${cat}</div>
        <div style="font-weight:600;">${dish.name}</div>
        <div class="desc">${dish.desc || ''}</div>
        <div style="font-size:0.97em; color:#555; margin:6px 0 2px 0;">Ингредиенты:</div>
        <ul style="margin:0 0 8px 16px; padding:0; color:#666; font-size:0.97em;">
            ${(dish.ingredients||[]).map(ing => `<li>${getProductName(ing.product)} — ${ing.amount} ${getProductUnit(ing.product)}</li>`).join('')}
        </ul>
        <div class="card-actions">
            <button class="btn-secondary" onclick="editDish('${dish.id}')"><i class="fas fa-edit"></i></button>
            <button class="btn-danger" onclick="confirmDelete('dish','${dish.id}')"><i class="fas fa-trash"></i></button>
        </div>
    </div>`;
}

// --- Получение имени и единицы продукта по id ---
function getProductName(id) {
    return products.find(p => p.id === id)?.name || '—';
}
function getProductUnit(id) {
    return products.find(p => p.id === id)?.unit || '';
}

// === Рендер списка продуктов ===
function renderProductsList() {
    let search = (searchProduct.value || '').toLowerCase();
    let filtered = products.filter(p => !search || p.name.toLowerCase().includes(search));
    productsList.innerHTML = filtered.length ? filtered.map(productCard).join('') : '<div style="color:#888">Нет продуктов</div>';
}
function productCard(product) {
    return `<div class="card">
        <div style="font-weight:600;">${product.name}</div>
        <div style="color:#5b6dfa; font-size:0.97em;">${unitName(product.unit)}</div>
        <div style="color:#666;">Запас: <b>${product.amount}</b></div>
        <div class="card-actions">
            <button class="btn-secondary" onclick="editProduct('${product.id}')"><i class="fas fa-edit"></i></button>
            <button class="btn-danger" onclick="confirmDelete('product','${product.id}')"><i class="fas fa-trash"></i></button>
        </div>
    </div>`;
}
function unitName(unit) {
    switch(unit) {
        case 'g': return 'граммы';
        case 'kg': return 'килограммы';
        case 'ml': return 'миллилитры';
        case 'l': return 'литры';
        case 'pcs': return 'штуки';
        default: return unit;
    }
}

// === Рендер списка категорий ===
function renderCategoriesList() {
    categoriesList.innerHTML = categories.length ? categories.map(categoryCard).join('') : '<div style="color:#888">Нет категорий</div>';
}
function categoryCard(cat) {
    return `<div class="card">
        <div style="font-weight:600;">${cat.name}</div>
        <div class="card-actions">
            <button class="btn-secondary" onclick="editCategory('${cat.id}')"><i class="fas fa-edit"></i></button>
            <button class="btn-danger" onclick="confirmDelete('category','${cat.id}')"><i class="fas fa-trash"></i></button>
        </div>
    </div>`;
}

// === Рендер опций категорий для фильтра и форм ===
function renderCategoryOptions() {
    // Для фильтра
    filterCategory.innerHTML = '<option value="">Все категории</option>' +
        categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    // Для формы блюда
    const dishCat = document.getElementById('dish-category');
    dishCat.innerHTML = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}

// === Поиск и фильтрация ===
filterCategory.addEventListener('change', e => {
    filter.category = e.target.value;
    renderDishesList();
});
searchDish.addEventListener('input', e => {
    filter.search = e.target.value;
    renderDishesList();
});
searchProduct.addEventListener('input', renderProductsList);

// === Модальные окна: открытие и закрытие ===
function openModal(modal) {
    modals[modal].classList.add('active');
}
function closeModal(modal) {
    modals[modal].classList.remove('active');
}
// Кнопки закрытия
Array.from(document.querySelectorAll('.close')).forEach(btn => {
    btn.onclick = () => closeModal(btn.dataset.close.replace('-modal',''));
});
// Закрытие по клику вне окна
Object.values(modals).forEach(modal => {
    modal.addEventListener('mousedown', e => {
        if (e.target === modal) closeModal(modal.id.replace('-modal',''));
    });
});

// === CRUD для блюд ===
document.getElementById('add-dish').onclick = () => {
    currentEdit = { type: 'dish', id: null };
    forms.dish.reset();
    document.getElementById('image-preview').innerHTML = '';
    document.getElementById('ingredients-list').innerHTML = '';
    openModal('dish');
};
forms.dish.onsubmit = function(e) {
    e.preventDefault();
    const id = document.getElementById('dish-id').value || genId();
    const name = document.getElementById('dish-name').value.trim();
    const category = document.getElementById('dish-category').value;
    const desc = document.getElementById('dish-desc').value.trim();
    const image = document.getElementById('image-preview').dataset.img || '';
    const ingredients = Array.from(document.querySelectorAll('.ingredient-row')).map(row => ({
        product: row.querySelector('.ingredient-product').value,
        amount: row.querySelector('.ingredient-amount').value
    }));
    if (!name || !category) return notify('Заполните все поля', true);
    const dish = { id, name, category, desc, image, ingredients };
    const idx = dishes.findIndex(d => d.id === id);
    if (idx > -1) dishes[idx] = dish; else dishes.push(dish);
    saveToLS(LS_KEYS.dishes, dishes);
    renderDishesList();
    closeModal('dish');
    notify('Блюдо сохранено');
};
// Редактирование блюда
window.editDish = function(id) {
    const dish = dishes.find(d => d.id === id);
    if (!dish) return;
    currentEdit = { type: 'dish', id };
    forms.dish.reset();
    document.getElementById('dish-id').value = dish.id;
    document.getElementById('dish-name').value = dish.name;
    document.getElementById('dish-category').value = dish.category;
    document.getElementById('dish-desc').value = dish.desc;
    document.getElementById('image-preview').innerHTML = dish.image ? `<img src="${dish.image}">` : '';
    document.getElementById('image-preview').dataset.img = dish.image || '';
    renderIngredients(dish.ingredients);
    openModal('dish');
};
// Удаление блюда
function deleteDish(id) {
    dishes = dishes.filter(d => d.id !== id);
    saveToLS(LS_KEYS.dishes, dishes);
    renderDishesList();
    notify('Блюдо удалено');
}

// === Работа с ингредиентами блюда ===
document.getElementById('add-ingredient').onclick = function() {
    addIngredientRow();
};
function renderIngredients(ings=[]) {
    const list = document.getElementById('ingredients-list');
    list.innerHTML = '';
    ings.forEach(ing => addIngredientRow(ing));
}
function addIngredientRow(ing={}) {
    const row = document.createElement('div');
    row.className = 'ingredient-row';
    row.innerHTML = `
        <select class="ingredient-product" required>
            <option value="">Продукт</option>
            ${products.map(p => `<option value="${p.id}"${p.id===ing.product?' selected':''}>${p.name}</option>`).join('')}
        </select>
        <input type="number" class="ingredient-amount" placeholder="Кол-во" min="0" step="0.01" value="${ing.amount||''}" required>
        <button type="button" class="remove-ingredient">&times;</button>
    `;
    row.querySelector('.remove-ingredient').onclick = () => row.remove();
    document.getElementById('ingredients-list').appendChild(row);
}

// --- Загрузка и предпросмотр картинки блюда ---
document.getElementById('dish-image').onchange = function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
        document.getElementById('image-preview').innerHTML = `<img src="${ev.target.result}">`;
        document.getElementById('image-preview').dataset.img = ev.target.result;
    };
    reader.readAsDataURL(file);
};

// === CRUD для продуктов ===
document.getElementById('add-product').onclick = () => {
    currentEdit = { type: 'product', id: null };
    forms.product.reset();
    document.getElementById('product-id').value = '';
    openModal('product');
};
forms.product.onsubmit = function(e) {
    e.preventDefault();
    const id = document.getElementById('product-id').value || genId();
    const name = document.getElementById('product-name').value.trim();
    const unit = document.getElementById('product-unit').value;
    const amount = +document.getElementById('product-amount').value;
    if (!name || !unit) return notify('Заполните все поля', true);
    const product = { id, name, unit, amount };
    const idx = products.findIndex(p => p.id === id);
    if (idx > -1) products[idx] = product; else products.push(product);
    saveToLS(LS_KEYS.products, products);
    renderProductsList();
    renderIngredients();
    closeModal('product');
    notify('Продукт сохранён');
};
window.editProduct = function(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;
    currentEdit = { type: 'product', id };
    forms.product.reset();
    document.getElementById('product-id').value = product.id;
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-unit').value = product.unit;
    document.getElementById('product-amount').value = product.amount;
    openModal('product');
};
function deleteProduct(id) {
    products = products.filter(p => p.id !== id);
    saveToLS(LS_KEYS.products, products);
    renderProductsList();
    renderIngredients();
    notify('Продукт удалён');
}

// === CRUD для категорий ===
document.getElementById('add-category').onclick = () => {
    currentEdit = { type: 'category', id: null };
    forms.category.reset();
    openModal('category');
};
forms.category.onsubmit = function(e) {
    e.preventDefault();
    const id = document.getElementById('category-id').value || genId();
    const name = document.getElementById('category-name').value.trim();
    if (!name) return notify('Введите название категории', true);
    const cat = { id, name };
    const idx = categories.findIndex(c => c.id === id);
    if (idx > -1) categories[idx] = cat; else categories.push(cat);
    saveToLS(LS_KEYS.categories, categories);
    renderCategoriesList();
    renderCategoryOptions();
    closeModal('category');
    notify('Категория сохранена');
};
window.editCategory = function(id) {
    const cat = categories.find(c => c.id === id);
    if (!cat) return;
    currentEdit = { type: 'category', id };
    forms.category.reset();
    document.getElementById('category-id').value = cat.id;
    document.getElementById('category-name').value = cat.name;
    openModal('category');
};
function deleteCategory(id) {
    categories = categories.filter(c => c.id !== id);
    saveToLS(LS_KEYS.categories, categories);
    renderCategoriesList();
    renderCategoryOptions();
    notify('Категория удалена');
}

// === Подтверждение удаления ===
window.confirmDelete = function(type, id) {
    modals.confirm.classList.add('active');
    modals.confirm.dataset.type = type;
    modals.confirm.dataset.id = id;
};
document.getElementById('confirm-no').onclick = () => closeModal('confirm');
document.getElementById('confirm-yes').onclick = function() {
    const { type, id } = modals.confirm.dataset;
    if (type === 'dish') deleteDish(id);
    if (type === 'product') deleteProduct(id);
    if (type === 'category') deleteCategory(id);
    closeModal('confirm');
};

// === Уведомления ===
function notify(msg, danger=false) {
    notification.textContent = msg;
    notification.className = '';
    notification.classList.add('show');
    if (danger) notification.style.background = '#ff4d4f';
    else notification.style.background = '#5b6dfa';
    setTimeout(() => notification.classList.remove('show'), 1800);
}

// === Автообновление ингредиентов при изменении продуктов ===
function renderIngredients(ings=[]) {
    const list = document.getElementById('ingredients-list');
    list.innerHTML = '';
    ings.forEach(ing => addIngredientRow(ing));
}

// === Автообновление при изменении данных ===
window.addEventListener('storage', () => {
    loadAll();
    renderAll();
});

// === Экспорт в Excel (XLSX) ===
document.getElementById('export-products-xlsx').onclick = function() {
    // Формируем массив объектов для экспорта
    const data = products.map(p => ({
        'Название': p.name,
        'Ед. изм.': unitName(p.unit),
        'Количество': p.amount
    }));
    exportToExcel(data, 'products.xlsx', 'Продукты');
};
document.getElementById('export-dishes-xlsx').onclick = function() {
    // Формируем массив объектов для экспорта
    const data = dishes.map(d => ({
        'Название': d.name,
        'Категория': categories.find(c => c.id === d.category)?.name || '',
        'Описание': d.desc,
        'Ингредиенты': (d.ingredients||[]).map(ing => `${getProductName(ing.product)} — ${ing.amount} ${getProductUnit(ing.product)}`).join('; ')
    }));
    exportToExcel(data, 'dishes.xlsx', 'Блюда');
};
// Универсальная функция экспорта в Excel
function exportToExcel(data, filename, sheetName) {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, filename);
}

// === Открытие FAQ ===
document.getElementById('open-faq').onclick = function() {
    document.getElementById('faq-modal').classList.add('active');
};
// Поддержка закрытия FAQ-модалки
const faqModal = document.getElementById('faq-modal');
faqModal.querySelector('.close').onclick = function() {
    faqModal.classList.remove('active');
};
faqModal.addEventListener('mousedown', function(e) {
    if (e.target === faqModal) faqModal.classList.remove('active');
});