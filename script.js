// Arreglos de Estado Global
const nodes = [];
const edges = [];

// Elementos capturados de la interfaz
const nodeInput = document.getElementById('node-name');
const btnAddNode = document.getElementById('btn-add-node');
const nodesList = document.getElementById('nodes-list');

const sourceSelect = document.getElementById('source-node');
const destSelect = document.getElementById('dest-node');
const distanceInput = document.getElementById('distance');
const btnAddEdge = document.getElementById('btn-add-edge');
const edgesVisualList = document.getElementById('edges-visual-list');

const searchSourceSelect = document.getElementById('search-source');
const searchDestSelect = document.getElementById('search-dest');
const btnSearchRoute = document.getElementById('btn-search-route');

const resultsSection = document.getElementById('results-section');
const routesListOutput = document.getElementById('routes-list-output');
const bestRouteBox = document.getElementById('best-route-box');
const errorContainer = document.getElementById('error-container');

// Control de Errores e Interfaces (HU-009)
function showError(msg) {
    errorContainer.textContent = msg;
    errorContainer.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function clearError() {
    errorContainer.classList.add('hidden');
}

// Sincronización de Selectores Desplegables (HU-005)
function refreshDropdowns() {
    const dropdowns = [sourceSelect, destSelect, searchSourceSelect, searchDestSelect];
    dropdowns.forEach(select => {
        const previousValue = select.value;
        select.innerHTML = '<option value="">Seleccione...</option>';
        nodes.forEach(node => {
            const opt = document.createElement('option');
            opt.value = node;
            opt.textContent = node;
            select.appendChild(opt);
        });
        select.value = previousValue;
    });
}

// Registro de Nodos (HU-001, HU-002)
btnAddNode.addEventListener('click', () => {
    clearError();
    const name = nodeInput.value.trim();

    if (!name) {
        showError("Error: El campo de nombre de nodo no puede estar vacío.");
        return;
    }
    if (nodes.includes(name)) {
        showError("Error: El nodo especificado ya se encuentra registrado.");
        return;
    }

    nodes.push(name);
    nodeInput.value = '';
    
    const li = document.createElement('li');
    li.textContent = name;
    nodesList.appendChild(li);

    refreshDropdowns();
});

// Lógica de Conexiones (HU-003, HU-004)
btnAddEdge.addEventListener('click', () => {
    clearError();
    const src = sourceSelect.value;
    const dst = destSelect.value;
    const dist = parseInt(distanceInput.value, 10);

    if (!src || !dst) {
        showError("Error: Seleccione un origen y un destino válidos.");
        return;
    }
    if (src === dst) {
        showError("Error: El origen y el destino no pueden ser idénticos.");
        return;
    }
    if (isNaN(dist) || dist <= 0) {
        showError("Error: La distancia en Km debe ser un valor numérico mayor a cero.");
        return;
    }
    if (edges.some(e => e.src === src && e.dst === dst)) {
        showError("Error: Ya se ha registrado una conexión directa entre estos puntos.");
        return;
    }

    edges.push({ src, dst, dist });
    distanceInput.value = '';

    renderVisualEdges();
});

function renderVisualEdges() {
    edgesVisualList.innerHTML = '';
    
    if (edges.length === 0) {
        edgesVisualList.innerHTML = '<div style="color: #64748b; text-align: center; padding-top: 2rem; font-size: 0.9rem;">No hay conexiones registradas aún.</div>';
        return;
    }

    edges.forEach(edge => {
        // Creamos la tarjeta contenedora
        const card = document.createElement('div');
        card.className = 'route-connection-card';

        // Estructura interna HTML de la tarjeta logística
        card.innerHTML = `
            <div class="route-node-badge">${edge.src}</div>
            <div class="route-line-connector">
                <span class="distance-label">${edge.dist} Km</span>
                <div class="arrow-line"></div>
            </div>
            <div class="route-node-badge">${edge.dst}</div>
        `;
        
        edgesVisualList.appendChild(card);
    });
}

// Algoritmo de Búsqueda y Despliegue Dividido (HU-006, HU-007, HU-008)
btnSearchRoute.addEventListener('click', () => {
    clearError();
    resultsSection.classList.add('hidden');
    routesListOutput.innerHTML = '';
    bestRouteBox.innerHTML = '';

    const start = searchSourceSelect.value;
    const end = searchDestSelect.value;

    if (!start || !end) {
        showError("Error: Seleccione los puntos de origen y destino para procesar el análisis.");
        return;
    }
    if (start === end) {
        showError("Error: Las ubicaciones de tramo deben ser diferentes.");
        return;
    }

    const availablePaths = [];

    // 1. Evaluar Conexión Directa (HU-006)
    const directMatch = edges.find(e => e.src === start && e.dst === end);
    if (directMatch) {
        availablePaths.push({
            title: "Ruta Directa Encontrada",
            sequence: `${start} → ${end}`,
            totalDistance: directMatch.dist
        });
    }

    // 2. Evaluar Conexión con Nodo Intermedio (HU-007)
    nodes.forEach(interim => {
        if (interim !== start && interim !== end) {
            const step1 = edges.find(e => e.src === start && e.dst === interim);
            const step2 = edges.find(e => e.src === interim && e.dst === end);

            if (step1 && step2) {
                availablePaths.push({
                    title: "Ruta con Nodo Intermedio",
                    sequence: `${start} → ${interim} → ${end}`,
                    totalDistance: step1.dist + step2.dist
                });
            }
        }
    });

    if (availablePaths.length === 0) {
        showError("Mensaje del Sistema: No existe ninguna ruta disponible (directa o intermedia) entre los puntos seleccionados.");
        return;
    }

    resultsSection.classList.remove('hidden');

    // Inyectar el bloque textual en la zona izquierda
    availablePaths.forEach(path => {
        const block = document.createElement('div');
        block.className = 'route-text-block';
        block.innerHTML = `
            <p><strong>${path.title}</strong></p>
            <p>${path.sequence}</p>
            <p>Distancia Total: ${path.totalDistance} Km</p>
        `;
        routesListOutput.appendChild(block);
    });

    // 3. Determinar y destacar de forma exacta la MEJOR RUTA en el recuadro (HU-008)
    const minDistance = Math.min(...availablePaths.map(p => p.totalDistance));
    const optimalPath = availablePaths.find(p => p.totalDistance === minDistance);

    bestRouteBox.innerHTML = `
        <h3>MEJOR RUTA</h3>
        <p>${optimalPath.sequence}</p>
        <p>Distancia Total: ${optimalPath.totalDistance} Km</p>
    `;
});