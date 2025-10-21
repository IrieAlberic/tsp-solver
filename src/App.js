import React, { useState } from 'react';
import { Play, Download, RefreshCw } from 'lucide-react';

const TSPSolver = () => {
  const [activeTab, setActiveTab] = useState('greedy');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);

  // Vraies données Berlin52 complètes
  const berlin52 = [
    [565.0,575.0],[25.0,185.0],[345.0,750.0],[945.0,685.0],[845.0,655.0],
    [880.0,660.0],[25.0,230.0],[525.0,1000.0],[580.0,1175.0],[650.0,1130.0],
    [1605.0,620.0],[1220.0,580.0],[1465.0,200.0],[1530.0,5.0],[845.0,680.0],
    [725.0,370.0],[145.0,665.0],[415.0,635.0],[510.0,875.0],[560.0,365.0],
    [300.0,465.0],[520.0,585.0],[480.0,415.0],[835.0,625.0],[975.0,580.0],
    [1215.0,245.0],[1320.0,315.0],[1250.0,400.0],[660.0,180.0],[410.0,250.0],
    [420.0,555.0],[575.0,665.0],[1150.0,1160.0],[700.0,580.0],[685.0,595.0],
    [685.0,610.0],[770.0,610.0],[795.0,645.0],[720.0,635.0],[760.0,650.0],
    [475.0,960.0],[95.0,260.0],[875.0,920.0],[700.0,500.0],[555.0,815.0],
    [830.0,485.0],[1170.0,65.0],[830.0,610.0],[605.0,625.0],[595.0,360.0],
    [1340.0,725.0],[1740.0,245.0]
  ];

  // Vraies données eil101 complètes
  const eil101 = [
    [41,49],[35,17],[55,45],[55,20],[15,30],[25,30],[20,50],[10,43],[55,60],[30,60],
    [20,65],[50,35],[30,25],[15,10],[30,5],[10,20],[5,30],[20,40],[15,60],[45,65],
    [45,20],[45,10],[55,5],[65,35],[65,20],[45,30],[35,40],[41,37],[64,42],[40,60],
    [31,52],[35,69],[53,52],[65,55],[63,65],[2,60],[20,20],[5,5],[60,12],[40,25],
    [42,7],[24,12],[23,3],[11,14],[6,38],[2,48],[8,56],[13,52],[6,68],[47,47],
    [49,58],[27,43],[37,31],[57,29],[63,23],[53,12],[32,12],[36,26],[21,24],[17,34],
    [12,24],[24,58],[27,69],[15,77],[62,77],[49,73],[67,5],[56,39],[37,47],[37,56],
    [57,68],[47,16],[44,17],[46,13],[49,11],[49,42],[53,43],[61,52],[57,48],[56,37],
    [55,54],[15,47],[14,37],[11,31],[16,22],[4,18],[28,18],[26,52],[26,35],[31,67],
    [15,19],[22,22],[18,24],[26,27],[25,24],[22,27],[25,21],[19,21],[20,26],[18,18],
    [35,35]
  ];

  const [currentDataset, setCurrentDataset] = useState('berlin52');

  // Distance TSPLIB EUC_2D avec arrondi
  const euc2d = (a, b) => {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    return Math.floor(Math.sqrt(dx * dx + dy * dy) + 0.5);
  };

  // Matrice de distance
  const distanceMatrix = (coords) => {
    const n = coords.length;
    const D = Array(n).fill().map(() => Array(n).fill(0));
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i !== j) {
          D[i][j] = euc2d(coords[i], coords[j]);
        }
      }
    }
    return D;
  };

  // Greedy depuis un point de départ
  const greedyFromStart = (D, start) => {
    const n = D.length;
    const visited = new Array(n).fill(false);
    const tour = [start];
    visited[start] = true;
    let total = 0;
    let current = start;

    for (let k = 1; k < n; k++) {
      let next = -1;
      let best = Infinity;
      
      for (let j = 0; j < n; j++) {
        if (!visited[j] && D[current][j] < best) {
          best = D[current][j];
          next = j;
        }
      }
      
      total += best;
      visited[next] = true;
      tour.push(next);
      current = next;
    }
    
    // Fermer le tour
    total += D[current][start];
    return { tour, total };
  };

  // Greedy multi-démarrage
  const greedyMultiStart = (coords) => {
    const D = distanceMatrix(coords);
    let bestTour = null;
    let bestLength = Infinity;

    for (let start = 0; start < coords.length; start++) {
      const { tour, total } = greedyFromStart(D, start);
      if (total < bestLength) {
        bestLength = total;
        bestTour = tour;
      }
    }

    return { tour: bestTour, total: bestLength };
  };

  // 2-opt amélioré avec calcul delta
  const twoOpt = (tour, D, maxIterations = 100) => {
    let currentTour = [...tour];
    let improved = true;
    let iterations = 0;
    let currentDistance = calculateTourDistance(currentTour, D);

    while (improved && iterations < maxIterations) {
      improved = false;
      
      for (let i = 0; i < currentTour.length - 1; i++) {
        for (let j = i + 2; j < currentTour.length; j++) {
          // Calcul delta intelligent
          const a = currentTour[i];
          const b = currentTour[(i + 1) % currentTour.length];
          const c = currentTour[j];
          const d = currentTour[(j + 1) % currentTour.length];
          
          const currentEdges = D[a][b] + D[c][d];
          const newEdges = D[a][c] + D[b][d];
          const delta = newEdges - currentEdges;
          
          if (delta < 0) {
            // Inverser le segment
            const newTour = [
              ...currentTour.slice(0, i + 1),
              ...currentTour.slice(i + 1, j + 1).reverse(),
              ...currentTour.slice(j + 1)
            ];
            
            currentTour = newTour;
            currentDistance += delta;
            improved = true;
            break;
          }
        }
        if (improved) break;
      }
      iterations++;
    }

    return { 
      tour: currentTour, 
      distance: currentDistance,
      iterations 
    };
  };

  // Recuit simulé amélioré
  const simulatedAnnealing = (coords, tempInit = 10000, tempFinal = 0.1, alpha = 0.95, maxIter = 100) => {
    const D = distanceMatrix(coords);
    const greedyResult = greedyMultiStart(coords);
    let current = greedyResult.tour;
    let best = [...current];
    let currentDist = greedyResult.total;
    let bestDist = currentDist;
    let temp = tempInit;

    while (temp > tempFinal) {
      for (let iter = 0; iter < maxIter; iter++) {
        // Générer voisin 2-opt aléatoire
        const i = Math.floor(Math.random() * (current.length - 1));
        const j = Math.floor(Math.random() * (current.length - i - 2)) + i + 2;
        
        const newTour = [
          ...current.slice(0, i + 1),
          ...current.slice(i + 1, j + 1).reverse(),
          ...current.slice(j + 1)
        ];

        const newDist = calculateTourDistance(newTour, D);
        const delta = newDist - currentDist;

        if (delta < 0 || Math.random() < Math.exp(-delta / temp)) {
          current = newTour;
          currentDist = newDist;
          if (currentDist < bestDist) {
            best = [...current];
            bestDist = currentDist;
          }
        }
      }
      temp *= alpha;
    }

    return { tour: best, distance: bestDist };
  };

  const calculateTourDistance = (tour, D) => {
    let total = 0;
    const n = tour.length;
    for (let i = 0; i < n; i++) {
      const next = (i + 1) % n;
      total += D[tour[i]][tour[next]];
    }
    return total;
  };

  const runAlgorithm = () => {
    setRunning(true);
    setTimeout(() => {
      const coords = currentDataset === 'berlin52' ? berlin52 : eil101;
      const D = distanceMatrix(coords);
      const optimal = currentDataset === 'berlin52' ? 7542 : 629;
      
      let res;
      switch (activeTab) {
        case 'greedy':
          const greedyResult = greedyMultiStart(coords);
          res = {
            tour: greedyResult.tour,
            distance: greedyResult.total,
            optimal: optimal,
            gap: ((greedyResult.total - optimal) / optimal * 100).toFixed(2),
            method: 'Méthode Constructive (Greedy Multi-Start)',
            dataset: currentDataset
          };
          break;
        case 'local':
          const greedyInitial = greedyMultiStart(coords);
          const localResult = twoOpt(greedyInitial.tour, D);
          res = {
            tour: localResult.tour,
            distance: localResult.distance,
            optimal: optimal,
            gap: ((localResult.distance - optimal) / optimal * 100).toFixed(2),
            iterations: localResult.iterations,
            method: 'Recherche Locale (2-opt)',
            dataset: currentDataset
          };
          break;
        case 'annealing':
          const saResult = simulatedAnnealing(coords);
          res = {
            tour: saResult.tour,
            distance: saResult.distance,
            optimal: optimal,
            gap: ((saResult.distance - optimal) / optimal * 100).toFixed(2),
            method: 'Recuit Simulé',
            dataset: currentDataset
          };
          break;
        default:
          res = null;
      }
      setResult(res);
      setRunning(false);
    }, 100);
  };

  const getDatasetInfo = () => {
    if (currentDataset === 'berlin52') {
      return {
        name: 'Berlin52',
        cities: 52,
        optimal: 7542,
        description: '52 localisations à Berlin - Problème classique TSP'
      };
    } else {
      return {
        name: 'EIL101',
        cities: 101,
        optimal: 629,
        description: '101 villes - Problème de test standard'
      };
    }
  };

  const datasetInfo = getDatasetInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-6 border border-white/20">
          <h1 className="text-4xl font-bold text-white mb-2">
            Résolution du Problème du Voyageur de Commerce
          </h1>
          <p className="text-blue-200">
            Implémentation et comparaison des méthodes d'optimisation - Données réelles TSPLIB
          </p>
        </div>

        {/* Dataset Selector */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <div className="flex gap-4 items-center">
            <label className="text-white font-semibold">Dataset:</label>
            <select 
              value={currentDataset}
              onChange={(e) => setCurrentDataset(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
            >
              <option value="berlin52">Berlin52 (52 villes)</option>
              <option value="eil101">EIL101 (101 villes)</option>
            </select>
            <div className="ml-auto text-blue-200">
              <strong>{datasetInfo.name}</strong> - {datasetInfo.cities} villes - Optimal: {datasetInfo.optimal}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-2 mb-6 border border-white/20">
          <div className="flex gap-2">
            {[
              { id: 'greedy', label: 'Méthode Constructive' },
              { id: 'local', label: 'Recherche Locale' },
              { id: 'annealing', label: 'Recuit Simulé' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-white/5 text-blue-200 hover:bg-white/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Control Panel */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <div className="flex gap-4">
            <button
              onClick={runAlgorithm}
              disabled={running}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {running ? (
                <>
                  <RefreshCw className="animate-spin" size={20} />
                  Calcul en cours...
                </>
              ) : (
                <>
                  <Play size={20} />
                  Exécuter l'algorithme
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">
              Résultats - {result.method}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-blue-500/20 rounded-xl p-6 border border-blue-400/30">
                <div className="text-blue-200 text-sm mb-2">Distance Totale</div>
                <div className="text-3xl font-bold text-white">{result.distance}</div>
                <div className="text-blue-200 text-sm mt-1">Optimal: {result.optimal}</div>
              </div>
              
              <div className="bg-green-500/20 rounded-xl p-6 border border-green-400/30">
                <div className="text-green-200 text-sm mb-2">Écart à l'optimal</div>
                <div className="text-3xl font-bold text-white">{result.gap}%</div>
                <div className="text-green-200 text-sm mt-1">Gap de performance</div>
              </div>

              <div className="bg-purple-500/20 rounded-xl p-6 border border-purple-400/30">
                <div className="text-purple-200 text-sm mb-2">Nombre de Villes</div>
                <div className="text-3xl font-bold text-white">{result.tour.length}</div>
                <div className="text-purple-200 text-sm mt-1">Dataset: {datasetInfo.name}</div>
              </div>
            </div>

            {result.iterations && (
              <div className="bg-orange-500/20 rounded-xl p-4 border border-orange-400/30 mb-6">
                <div className="text-orange-200 text-sm mb-1">Itérations 2-opt</div>
                <div className="text-2xl font-bold text-white">{result.iterations}</div>
              </div>
            )}

            <div className="bg-white/5 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Tour Optimal (premières 10 villes)</h3>
              <div className="text-blue-200 font-mono text-sm">
                {result.tour.slice(0, 10).join(' → ')} ... [Total: {result.tour.length} villes]
              </div>
            </div>
          </div>
        )}

        {/* Info Panel */}
        <div className="mt-6 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-4">Informations Techniques</h3>
          <div className="text-blue-200 space-y-2">
            <p>• <strong>Distance:</strong> EUC_2D TSPLIB (arrondi à l'entier le plus proche)</p>
            <p>• <strong>Méthode Constructive:</strong> Plus proche voisin avec multi-démarrage</p>
            <p>• <strong>2-opt:</strong> Implémentation optimisée avec calcul delta</p>
            <p>• <strong>Recuit Simulé:</strong> Température adaptative avec voisinage 2-opt</p>
            <p>• <strong>Optimal de référence:</strong> Berlin52=7542, EIL101=629</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TSPSolver;