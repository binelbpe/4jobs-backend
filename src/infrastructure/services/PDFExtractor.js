class PDFExtractor {
    constructor() {
        try {
            this.poppler = new Poppler('/path/to/poppler/binaries'); // Specify the path to the Poppler binaries
        } catch (error) {
            console.error("Poppler binaries not found. Running in fallback mode.", error);
            this.poppler = null; // Set to null or handle accordingly
        }
        // ... existing code ...
    }
    // ... existing methods ...
}
