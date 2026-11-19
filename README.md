# Database-Indexing-Simulation-by-Using-B-Trees
# 🌳 IndexLab – Database Indexing Simulation Using B+ Trees

**An Interactive Web-Based Application for Visualizing and Simulating Database Indexing Using B+ Trees.**

## 📌 Project Overview

IndexLab is an interactive web application developed to demonstrate how **B+ Trees** are used in database indexing.

The application simulates essential database operations such as insertion, searching, deletion, updating, and range searching. It also provides a visual representation of the B+ Tree structure, helping users understand node splitting, merging, and rebalancing.

The project aims to make advanced data structure concepts easier to understand through practical implementation and visualization.

## ✨ Features

- **Insert Records:** Add new student records to the B+ Tree.
- **Search Records:** Search for records using their unique IDs.
- **Delete Records:** Remove existing records with automatic tree rebalancing.
- **Update Records:** Modify existing student information.
- **B+ Tree Visualization:** View internal nodes, leaf nodes, and their connections.
- **Node Splitting:** Demonstrates how nodes split when they exceed their capacity.
- **Node Merging and Borrowing:** Handles deletion and tree rebalancing.
- **Range Search:** Retrieve records within a specified ID range.
- **Performance Comparison:** Compare linear search and B+ Tree search operations.
- **CSV Export:** Export student records into a CSV file.
- **Data Persistence:** Store records using browser LocalStorage.
- **Animated Walkthrough:** Explore tree operations step by step.
- **Light Theme:** Clean, responsive, and user-friendly interface.

## 🛠️ Technologies Used

| Technology | Purpose |
|---|---|
| HTML5 | Application structure |
| CSS3 | Styling and responsive design |
| JavaScript | B+ Tree implementation and functionality |
| SVG | B+ Tree visualization |
| LocalStorage | Browser-based data persistence |

## 🏗️ Project Structure

```text
IndexLab/
│
├── index.html       # Main application interface
├── styles.css       # Styling and layout
├── app.js           # B+ Tree logic and application functionality
│
└── README.md        # Project documentation
```

## 🚀 Getting Started

Follow these steps to run the project locally.

### Prerequisites

- A computer with Windows, Linux, or macOS.
- Visual Studio Code (recommended).
- A modern web browser.
- Live Server extension for VS Code (recommended).

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/YOUR-USERNAME/IndexLab.git
```

**2. Open the project folder**

```bash
cd IndexLab
```

**3. Open the folder in Visual Studio Code**

```bash
code .
```

**4. Run the application**

- Install the Live Server extension in VS Code.
- Open `index.html`.
- Right-click and select **Open with Live Server**.
- The application will open in your default browser.

Alternatively, you can open `index.html` directly in a browser.

## 🌲 B+ Tree Implementation

This project implements a B+ Tree with an order of 4.

### Key Characteristics

- Maximum of 4 children per internal node.
- Maximum of 3 keys per node.
- All actual records are stored in leaf nodes.
- Internal nodes contain separator keys for navigation.
- Leaf nodes are linked to support efficient range queries.
- Insertion and deletion maintain B+ Tree properties through splitting, borrowing, and merging.

### Time Complexity

| Operation | Average Time Complexity |
|---|---|
| Search | O(log n) |
| Insertion | O(log n) |
| Deletion | O(log n) |
| Range Search | O(log n + k) |

Where:
- `n` = Number of records.
- `k` = Number of records returned in the range query.

## 📊 Application Modules

1. **Dashboard:** Displays record statistics and tree information.
2. **Record Management:** Supports insertion, searching, updating, and deletion.
3. **Tree Visualizer:** Displays the B+ Tree structure.
4. **Range Search:** Finds records within a given range.
5. **Performance Analysis:** Compares search operations.
6. **Data Export:** Allows records to be exported as CSV.
7. **Animation Module:** Demonstrates tree operations step by step.

## 🎯 Learning Outcomes

Through this project, we explored:

- Implementation of B+ Tree data structures.
- Database indexing concepts.
- Tree traversal and searching techniques.
- Node splitting and merging.
- Borrowing and rebalancing operations.
- Performance analysis of searching algorithms.
- Interactive data structure visualization.
- Frontend development using HTML, CSS, and JavaScript.

## 🔮 Future Enhancements

- Integration with a MySQL database.
- Backend implementation using Java or Node.js.
- Support for larger datasets.
- Advanced performance benchmarking.
- Additional indexing techniques such as B-Trees and Hash Indexing.

## 👨‍💻 Project Information

**Project Title:** Database Indexing Simulation Using B+ Trees

**Application Name:** IndexLab

**Course:** Advanced Data Structures

**Project Type:** Academic Mini Project

## 👥 Contributors

- **Shaik Mustayeen**
- **Tanveer Ahmed**

## 📄 License

This project is developed for academic and educational purposes.

---

⭐ If you find this project useful, consider giving the repository a star!

**IndexLab – Making Database Indexing Visual and Interactive.**
