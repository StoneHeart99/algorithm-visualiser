class Graph {
    constructor() {
        this.cities = [];
        this.edges = {};
    }

    getEdges() { return this.edges; };
    getEdgeCount() { return Object.keys(this.edges).length };

    getCity(cityIndex) {
        return this.cities[cityIndex];
    };

    getCities() {
        return this.cities;
    };

    size() {
        return this.cities.length;
    };

    addCity(city) {
        this.cities.push(city);
    }

    addEdge(cityA, cityB) {
        this.edges[cityA.getName() + '-' + cityB.getName()] = new Edge(cityA, cityB);
    };

    getEdge(cityA, cityB) {
        if (this.edges[cityA.getName() + '-' + cityB.getName()] != undefined) {
            return this.edges[cityA.getName() + '-' + cityB.getName()];
        }
        if (this.edges[cityB.toString() + '-' + cityA.getName()] != undefined) {
            return this.edges[cityB.getName() + '-' + cityA.getName()];
        }
    };

    createEdges() {
        this.edges = {};

        for (let cityIndex = 0; cityIndex < this.cities.length; cityIndex++) {
            for (let connectionIndex = 0; connectionIndex < this.cities.length; connectionIndex++) {
                this.addEdge(this.cities[cityIndex], this.cities[connectionIndex]);
            }
        }
    };

    resetPheromone() {
        for (let edgeIndex in this.edges) {
            this.edges[edgeIndex].resetPheromone();
        }
    }

    clear() {
        this.cities = [];
        this.edges = {};
    }


};

class Edge {
    constructor(cityA, cityB) {
        this.cityA = cityA;
        this.cityB = cityB;
        this.initPheromone = 1;
        this.pheromone = this.initPheromone;

        // Calculate edge distance
        let deltaXSq = Math.pow((cityA.getX() - cityB.getX()), 2);
        let deltaYSq = Math.pow((cityA.getY() - cityB.getY()), 2);
        this.distance = Math.sqrt(deltaXSq + deltaYSq);
    }

    pointA() {
        return { 'x': this.cityA.getX(), 'y': this.cityA.getY() };
    }

    pointB() {
        return { 'x': this.cityB.getX(), 'y': this.cityB.getY() };
    }

    getPheromone() { return this.pheromone; };

    getDistance() { return this.distance; };

    contains(city) {
        if (this.cityA.getX() == city.getX()) {
            return true;
        }
        if (this.cityB.getX() == city.getX()) {
            return true;
        }
        return false;
    };

    setInitialPheromone(pheromone) {
        this.initPheromone = pheromone;
    };

    setPheromone(pheromone) {
        this.pheromone = pheromone;
    };

    resetPheromone() {
        this.pheromone = this.initPheromone;
    };

};

class Ant {
    constructor(graph, params) {
        this.graph = graph;
        this.alpha = params.alpha;
        this.beta = params.beta;
        this.q = params.q;
        this.tour = null;
    }

    reset() {
        this.tour = null;
    };

    init() {
        this.tour = new Tour();
        this.tour.addGraph(graph);
        this.currentCity = this.graph.getCity(0);
        this.tour.addCity(this.currentCity);
    }

    getTour() {
        return this.tour;
    };

    makeNextMove() {
        if (this.tour == null) {
            this.init();
        }

        let rouletteWheel = 0;
        let cities = this.graph.getCities();
        let finalPheromoneWeight;
        let cityProbabilities = [];

        // console.log("make next move");
        // console.log(this.graph);
        // let e = this.graph.getEdge(this.currentCity, cities[12]);
        // console.log(e);

        for (let cityIndex in cities) {
            if (!this.tour.contains(cities[cityIndex])) {
                let edge = this.graph.getEdge(this.currentCity, cities[cityIndex]);
                // console.log(edge);
                if (this.alpha == 1) {
                    finalPheromoneWeight = edge.getPheromone();
                } else {
                    finalPheromoneWeight = Math.pow(edge.getPheromone(), this.alpha);
                }
                // cityProbabilities[cityIndex] = finalPheromoneWeight * Math.pow(1.0 / edge.getDistance(), this.beta);
                let probability = finalPheromoneWeight * Math.pow(1.0 / edge.getDistance(), this.beta);
                cityProbabilities[cityIndex] = probability;
                rouletteWheel += probability;
                // rouletteWheel =  rouletteWheel + probability;
            }
        }

        let wheelTarget = rouletteWheel * Math.random();
        let wheelPosition = 0.0;

        for (let cityIndex in cities) {
            if (!this.tour.contains(cities[cityIndex])) {
                wheelPosition += cityProbabilities[cityIndex];
                if (wheelPosition >= wheelTarget) {
                    this.currentCity = cities[cityIndex];
                    this.tour.addCity(cities[cityIndex]);
                    // console.log(this.tour);
                    return;
                }
            }
        }
    };

    tourFound() {
        if (this.tour == null) {
            return false;
        }
        return (this.tour.size() >= this.graph.size());
    };

    run() {
        this.reset();
        while (!this.tourFound()) {
            this.makeNextMove();
        }
    };

    addPheromone(weight) {
        if (weight == undefined) {
            weight = 1;
        }

        let extraPheromone = (this.q * weight) / this.tour.getDistance();
        for (let tourIndex = 0; tourIndex < this.tour.size(); tourIndex++) {
            if (tourIndex >= this.tour.size()-1) {
                let fromCity = this.tour.getCity(tourIndex);
                let toCity = this.tour.getCity(0);
                let edge = this.graph.getEdge(fromCity, toCity);
                let pheromone = edge.getPheromone();
                edge.setPheromone(pheromone + extraPheromone);
            } else {
                let fromCity = this.tour.getCity(tourIndex);
                let toCity = this.tour.getCity(tourIndex+1);
                let edge = this.graph.getEdge(fromCity, toCity);
                let pheromone = edge.getPheromone();
                edge.setPheromone(pheromone + extraPheromone);
            }
        }
    };
};

class AntColony {
    constructor()
    {
        this.graph = new Graph();
        this.colony = [];

        // Set default params
        this.colonySize = 20;
        this.alpha = 1;
        this.beta = 3;
        this.rho = 0.1;
        this.q = 1;
        this.initPheromone = this.q;
        this.type = 'acs';
        this.elitistWeight = 0;
        this.maxIterations = 250;
        this.minScalingFactor = 0.001;

        this.setParams();

        this.iteration = 0;
        this.minPheromone = null;
        this.maxPheromone = null;

        this.iterationBest = null;
        this.globalBest = null;

        this.createAnts();
    }

    getGraph() { return this.graph; };
    setGraph(graph) { this.graph = graph };
    getAnts() { return this.colony; };
    size() { return this.colony.length; };
    currentIteration() { return this.iteration; };
    maxIterations() { return this.maxIterations; };

    createAnts() {
        this.colony = [];
        for (let antIndex = 0; antIndex < this.colonySize; antIndex++) {
            this.colony.push(new Ant(this.graph, {
                'alpha': this.alpha,
                'beta': this.beta,
                'q': this.q,
            }));
        }
    };

    setParams(params) {
        if (params != undefined) {
            if (params.colonySize != undefined) {
                this.colonySize = params.colonySize;
            }
            if (params.alpha != undefined) {
                this.alpha = params.alpha;
            }
            if (params.beta != undefined) {
                this.beta = params.beta;
            }
            if (params.rho != undefined) {
                this.rho = params.rho;
            }
            if (params.iterations != undefined) {
                this.maxIterations = params.iterations;
            }
            if (params.q != undefined) {
                this.q = params.q;
            }
            if (params.initPheromone != undefined) {
                this.initPheromone = params.initPheromone;
            }
            if (params.type != undefined) {
                if (params.type == 'elitist') {
                    if (params.elitistWeight != undefined) {
                        this.elitistWeight = params.elitistWeight;
                        this.type = 'elitist';
                    }
                } else if (params.type == 'maxmin') {
                    this.type = 'maxmin';
                } else {
                    this.type = 'acs';
                }
            }
        }
    };

    reset() {
        this.iteration = 0;
        this.globalBest = null;
        this.resetAnts();
        this.setInitialPheromone(this.initPheromone);
        this.graph.resetPheromone();
    };

    setInitialPheromone() {
        let edges = this.graph.getEdges();
        for (let edgeIndex in edges) {
            edges[edgeIndex].setInitialPheromone(this.initPheromone);
        }
    };

    resetAnts() {
        this.createAnts();
        this.iterationBest = null;
    };

    ready() {
        if (this.graph.size() <= 1) {
            return false;
        }
        return true;
    }

    run() {
        if (!this.ready()) {
            return;
        }

        this.iteration = 0;
        while (this.iteration < this.maxIterations) {
            this.step();
        }
    };

    step() {
        if (!this.ready() || this.iteration >= this.maxIterations) {
            return;
        }

        this.resetAnts();

        for (let antIndex in this.colony) {
            this.colony[antIndex].run();
        }

        this.getGlobalBest();
        this.updatePheromone();

        this.iteration++;
    };

    updatePheromone() {
        let edges = this.graph.getEdges();
        for (let edgeIndex in edges) {
            let pheromone = edges[edgeIndex].getPheromone();
            edges[edgeIndex].setPheromone(pheromone * (1 - this.rho));
        }

        if (this.type == 'maxmin') {
            if ((this.iteration / this.maxIterations) > 0.75) {
                let best = this.getGlobalBest();
            } else {
                let best = this.getIterationBest();
            }

            // Set maxmin
            this.maxPheromone = this.q / best.getTour().distance();
            this.minPheromone = this.maxPheromone * this.minScalingFactor;

            best.addPheromone();
        } else {
            for (let antIndex in this.colony) {
                this.colony[antIndex].addPheromone();
            }
        }

        if (this.type == 'elitist') {
            this.getGlobalBest().addPheromone(this.elitistWeight);
        }

        if (this.type == 'maxmin') {
            for (let edgeIndex in edges) {
                let pheromone = edges[edgeIndex].getPheromone();
                if (pheromone > this.maxPheromone) {
                    edges[edgeIndex].setPheromone(this.maxPheromone);
                } else if (pheromone < this.minPheromone) {
                    edges[edgeIndex].setPheromone(this.minPheromone);
                }
            }
        }
    };

    getIterationBest() {
        if (this.colony[0].getTour() == null) {
            return null;
        }

        if (this.iterationBest == null) {
            let best = this.colony[0]

            for (let antIndex in this.colony) {
                if (best.getTour().getDistance() >= this.colony[antIndex].getTour().getDistance()) {
                    this.iterationBest = this.colony[antIndex];
                }
            }
        }

        return this.iterationBest;
    };

    getGlobalBest() {
        let bestAnt = this.getIterationBest();
        if (bestAnt == null && this.globalBest == null) {
            return null;
        }

        if (bestAnt != null) {
            if (this.globalBest == null || this.globalBest.getTour().getDistance() >= bestAnt.getTour().getDistance()) {
                this.globalBest = bestAnt;
            }
        }
        return this.globalBest;
    };


};

