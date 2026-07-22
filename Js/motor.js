const STORAGE_KEY = "toviuHubLinks";

const defaultLinks = [
	{ name: "YouTube", url: "https://youtube.com", tag: "Video" },
	{ name: "Cinecalidad", url: "https://cinecalidad.ec", tag: "Cartelera", featured: true },
	{ name: "Twitch", url: "https://twitch.tv", tag: "En vivo" },
	{ name: "Netflix", url: "https://netflix.com", tag: "Streaming" },
	{ name: "Hbo", url: "https://play.max.com", tag: "Streaming" },
	{ name: "Disney+", url: "https://disneyplus.com", tag: "Streaming" },
	{ name: "Prime Video", url: "https://primevideo.com", tag: "Streaming" },
	{ name: "Spotify", url: "https://open.spotify.com", tag: "Musica" }
];

const linksGrid = document.getElementById("links-grid");
const addButton = document.getElementById("btn-add");
const resetButton = document.getElementById("btn-reset");
const menuButton = document.getElementById("btn-menu");
const closeMenuButton = document.getElementById("btn-close-menu");
const sidebar = document.getElementById("sidebar-menu");
const sidebarOverlay = document.getElementById("sidebar-overlay");
const modal = document.getElementById("modal");
const cancelButton = document.getElementById("btn-cancel");
const form = document.getElementById("link-form");
const nameInput = document.getElementById("link-name");
const urlInput = document.getElementById("link-url");
const tagInput = document.getElementById("link-tag");
const formError = document.getElementById("form-error");

let links = loadLinks();
let activeIndex = 0;
let dragSourceIndex = null;

renderLinks();
bindEvents();

function bindEvents() {
	addButton.addEventListener("click", openModal);
	cancelButton.addEventListener("click", closeModal);
	resetButton.addEventListener("click", resetLinks);
	menuButton.addEventListener("click", toggleSidebar);
	closeMenuButton.addEventListener("click", closeSidebar);
	sidebarOverlay.addEventListener("click", closeSidebar);

	addButton.addEventListener("click", closeSidebar);
	resetButton.addEventListener("click", closeSidebar);

	modal.addEventListener("click", (event) => {
		if (event.target instanceof HTMLElement && event.target.dataset.closeModal === "true") {
			closeModal();
		}
	});

	document.addEventListener("keydown", (event) => {
		if (event.key === "Escape" && isSidebarOpen()) {
			closeSidebar();
			return;
		}

		if (event.key === "Escape" && !modal.classList.contains("hidden")) {
			closeModal();
			return;
		}

		handleGlobalKeyboard(event);
	});

	form.addEventListener("submit", onSubmitForm);

	linksGrid.addEventListener("dragover", onGridDragOver);
	linksGrid.addEventListener("drop", onGridDrop);
	linksGrid.addEventListener("dragleave", onGridDragLeave);
}

function loadLinks() {
	const raw = localStorage.getItem(STORAGE_KEY);
	if (!raw) {
		return [...defaultLinks];
	}

	try {
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) {
			return [...defaultLinks];
		}

		const sanitized = parsed
			.filter(isValidLinkShape)
			.map((link) => ({
				name: String(link.name).trim(),
				url: normalizeUrl(String(link.url).trim()),
				tag: String(link.tag || "Sitio").trim(),
				featured: Boolean(link.featured)
			}))
			.filter((link) => Boolean(link.url));

		return sanitized.length ? sanitized : [...defaultLinks];
	} catch {
		return [...defaultLinks];
	}
}

function saveLinks() {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
}

function renderLinks() {
	linksGrid.innerHTML = "";
	const safeActiveIndex = Math.min(Math.max(activeIndex, 0), Math.max(links.length - 1, 0));
	activeIndex = safeActiveIndex;

	links.forEach((link, index) => {
		const tile = document.createElement("a");
		tile.className = "tile";
		tile.href = link.url;
		tile.target = "_self";
		tile.rel = "noreferrer";
		tile.dataset.index = String(index);
		tile.draggable = true;
		tile.tabIndex = index === safeActiveIndex ? 0 : -1;
		if (index === safeActiveIndex) {
			tile.classList.add("is-active");
		}
		tile.style.setProperty("--tile-bg", getTileBackground(link.url));

		tile.addEventListener("dragstart", onTileDragStart);
		tile.addEventListener("dragend", onTileDragEnd);
		tile.addEventListener("dragover", onTileDragOver);
		tile.addEventListener("drop", onTileDrop);
		tile.addEventListener("dragleave", onTileDragLeave);

		const label = document.createElement("span");
		label.className = "tile-label";
		label.textContent = link.name;

		const mark = document.createElement("span");
		mark.className = "tile-mark";
		mark.textContent = link.tag || "Sitio";

		const controls = document.createElement("div");
		controls.className = "tile-controls";

		controls.append(
			controlButton("subir", "↑", () => moveLink(index, -1)),
			controlButton("bajar", "↓", () => moveLink(index, 1)),
			controlButton("eliminar", "✕", () => deleteLink(index))
		);

		tile.append(label, mark, controls);
		linksGrid.appendChild(tile);
	});

	focusActiveTile(false);
}

function controlButton(title, icon, onClick) {
	const button = document.createElement("button");
	button.className = "icon-btn";
	button.type = "button";
	button.title = title;
	button.textContent = icon;
	button.addEventListener("click", (event) => {
		event.preventDefault();
		event.stopPropagation();
		onClick();
	});
	return button;
}

function moveLink(index, delta) {
	const nextIndex = index + delta;
	if (nextIndex < 0 || nextIndex >= links.length) {
		return;
	}

	const item = links[index];
	links[index] = links[nextIndex];
	links[nextIndex] = item;
	saveLinks();
	renderLinks();
}

function deleteLink(index) {
	links.splice(index, 1);
	if (activeIndex >= links.length) {
		activeIndex = Math.max(links.length - 1, 0);
	}
	saveLinks();
	renderLinks();
}

function resetLinks() {
	links = [...defaultLinks];
	saveLinks();
	renderLinks();
}

function openModal() {
	closeSidebar();
	form.reset();
	formError.textContent = "";
	modal.classList.remove("hidden");
	modal.setAttribute("aria-hidden", "false");
	nameInput.focus();
}

function closeModal() {
	modal.classList.add("hidden");
	modal.setAttribute("aria-hidden", "true");
}

function onSubmitForm(event) {
	event.preventDefault();
	formError.textContent = "";

	const name = nameInput.value.trim();
	const tag = tagInput.value.trim() || "Sitio";
	const normalizedUrl = normalizeUrl(urlInput.value.trim());

	if (!name) {
		formError.textContent = "El nombre es obligatorio.";
		return;
	}

	if (!normalizedUrl || !isValidHttpUrl(normalizedUrl)) {
		formError.textContent = "Ingresa una URL valida (http:// o https://).";
		return;
	}

	links.push({ name, url: normalizedUrl, tag });
	saveLinks();
	renderLinks();
	closeModal();
}

function normalizeUrl(url) {
	if (!url) {
		return "";
	}
	if (/^https?:\/\//i.test(url)) {
		return url;
	}
	return `https://${url}`;
}

function isValidHttpUrl(url) {
	try {
		const parsed = new URL(url);
		return parsed.protocol === "http:" || parsed.protocol === "https:";
	} catch {
		return false;
	}
}

function isValidLinkShape(item) {
	return item && typeof item.name === "string" && typeof item.url === "string";
}

function toggleSidebar() {
	if (isSidebarOpen()) {
		closeSidebar();
		return;
	}

	openSidebar();
}

function openSidebar() {
	sidebar.classList.remove("hidden");
	sidebarOverlay.classList.remove("hidden");
	sidebar.setAttribute("aria-hidden", "false");
	menuButton.setAttribute("aria-expanded", "true");
}

function closeSidebar() {
	sidebar.classList.add("hidden");
	sidebarOverlay.classList.add("hidden");
	sidebar.setAttribute("aria-hidden", "true");
	menuButton.setAttribute("aria-expanded", "false");
}

function isSidebarOpen() {
	return !sidebar.classList.contains("hidden");
}

function handleGlobalKeyboard(event) {
	if (isTypingContext(event.target)) {
		return;
	}

	const modalOpen = !modal.classList.contains("hidden");
	if (!modalOpen && (event.key === "n" || event.key === "N")) {
		event.preventDefault();
		openModal();
		return;
	}

	if (modalOpen) {
		return;
	}

	if (!links.length) {
		return;
	}

	const columns = getGridColumns();

	if (event.key === "ArrowLeft") {
		event.preventDefault();
		setActiveIndex(activeIndex - 1);
		return;
	}

	if (event.key === "ArrowRight") {
		event.preventDefault();
		setActiveIndex(activeIndex + 1);
		return;
	}

	if (event.key === "ArrowUp") {
		event.preventDefault();
		setActiveIndex(activeIndex - columns);
		return;
	}

	if (event.key === "ArrowDown") {
		event.preventDefault();
		setActiveIndex(activeIndex + columns);
		return;
	}

	if (event.key === "Enter" || event.key === " ") {
		event.preventDefault();
		activateActiveTile();
	}
}

function isTypingContext(target) {
	if (!(target instanceof HTMLElement)) {
		return false;
	}

	return Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
}

function getGridColumns() {
	const style = window.getComputedStyle(linksGrid);
	const template = style.gridTemplateColumns;
	if (!template) {
		return 1;
	}

	const columns = template.split(" ").filter(Boolean).length;
	return Math.max(columns, 1);
}

function setActiveIndex(nextIndex) {
	const clampedIndex = Math.min(Math.max(nextIndex, 0), links.length - 1);
	if (clampedIndex === activeIndex) {
		return;
	}

	activeIndex = clampedIndex;
	focusActiveTile(true);
}

function focusActiveTile(shouldFocus) {
	const tiles = linksGrid.querySelectorAll(".tile");
	if (!tiles.length) {
		return;
	}

	tiles.forEach((tile, index) => {
		tile.classList.toggle("is-active", index === activeIndex);
		tile.tabIndex = index === activeIndex ? 0 : -1;
	});

	if (shouldFocus) {
		const activeTile = tiles[activeIndex];
		if (activeTile instanceof HTMLElement) {
			activeTile.focus({ preventScroll: true });
			activeTile.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
		}
	}
}

function activateActiveTile() {
	const tiles = linksGrid.querySelectorAll(".tile");
	const activeTile = tiles[activeIndex];
	if (activeTile instanceof HTMLElement) {
		activeTile.click();
	}
}

function onTileDragStart(event) {
	const tile = event.currentTarget;
	if (!(tile instanceof HTMLElement)) {
		return;
	}

	const index = Number(tile.dataset.index);
	if (Number.isNaN(index)) {
		return;
	}

	dragSourceIndex = index;
	tile.classList.add("is-dragging");

	if (event.dataTransfer) {
		event.dataTransfer.effectAllowed = "move";
		event.dataTransfer.setData("text/plain", String(index));
	}
}

function onTileDragEnd() {
	clearDragVisualState();
	dragSourceIndex = null;
}

function onTileDragOver(event) {
	event.preventDefault();
	const tile = event.currentTarget;
	if (!(tile instanceof HTMLElement)) {
		return;
	}

	if (event.dataTransfer) {
		event.dataTransfer.dropEffect = "move";
	}

	markDropTarget(tile);
}

function onTileDrop(event) {
	event.preventDefault();
	event.stopPropagation();

	const tile = event.currentTarget;
	if (!(tile instanceof HTMLElement)) {
		return;
	}

	const targetIndex = Number(tile.dataset.index);
	if (Number.isNaN(targetIndex)) {
		return;
	}

	moveLinkByDrag(targetIndex);
}

function onTileDragLeave(event) {
	const tile = event.currentTarget;
	if (!(tile instanceof HTMLElement)) {
		return;
	}

	const related = event.relatedTarget;
	if (related instanceof Node && tile.contains(related)) {
		return;
	}

	tile.classList.remove("is-drop-target");
}

function onGridDragOver(event) {
	event.preventDefault();
	if (event.dataTransfer) {
		event.dataTransfer.dropEffect = "move";
	}

	const targetTile = event.target instanceof HTMLElement ? event.target.closest(".tile") : null;
	if (!targetTile) {
		clearDropTargets();
	}
}

function onGridDrop(event) {
	event.preventDefault();

	const targetTile = event.target instanceof HTMLElement ? event.target.closest(".tile") : null;
	if (targetTile instanceof HTMLElement) {
		return;
	}

	moveLinkByDrag(links.length);
}

function onGridDragLeave(event) {
	const related = event.relatedTarget;
	if (related instanceof Node && linksGrid.contains(related)) {
		return;
	}

	clearDropTargets();
}

function moveLinkByDrag(targetIndex) {
	if (dragSourceIndex === null || !Number.isInteger(targetIndex)) {
		clearDragVisualState();
		dragSourceIndex = null;
		return;
	}

	if (targetIndex < 0) {
		targetIndex = 0;
	}
	if (targetIndex > links.length) {
		targetIndex = links.length;
	}

	let insertionIndex = targetIndex;
	if (dragSourceIndex < targetIndex) {
		insertionIndex = targetIndex - 1;
	}

	if (insertionIndex === dragSourceIndex) {
		clearDragVisualState();
		dragSourceIndex = null;
		return;
	}

	const [moved] = links.splice(dragSourceIndex, 1);
	if (!moved) {
		clearDragVisualState();
		dragSourceIndex = null;
		return;
	}

	links.splice(insertionIndex, 0, moved);
	activeIndex = insertionIndex;
	saveLinks();
	clearDragVisualState();
	dragSourceIndex = null;
	renderLinks();
}

function markDropTarget(targetTile) {
	clearDropTargets();
	targetTile.classList.add("is-drop-target");
}

function clearDropTargets() {
	const targets = linksGrid.querySelectorAll(".tile.is-drop-target");
	targets.forEach((tile) => tile.classList.remove("is-drop-target"));
}

function clearDragVisualState() {
	const draggingTiles = linksGrid.querySelectorAll(".tile.is-dragging");
	draggingTiles.forEach((tile) => tile.classList.remove("is-dragging"));
	clearDropTargets();
}

function getTileBackground(url) {
	try {
		const parsed = new URL(url);
		const host = parsed.hostname;
		const primary = `https://logo.clearbit.com/${host}`;
		const fallback = `https://www.google.com/s2/favicons?domain=${host}&sz=256`;
		return `url("${primary}"), url("${fallback}")`;
	} catch {
		return "linear-gradient(180deg, #181a22 0%, #111218 100%)";
	}
}
