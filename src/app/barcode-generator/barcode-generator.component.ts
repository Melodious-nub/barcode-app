import { Component, ViewChildren, QueryList, ElementRef } from '@angular/core';
import JsBarcode from 'jsbarcode';
import jsPDF from 'jspdf';

// Define an interface for products including lastNumber
interface Product {
  name: string;
  code: string;
  lastNumber?: number; // Optional property
}

interface BarcodeCount {
  productName: string;
  count: number;
}

@Component({
  selector: 'app-barcode-generator',
  templateUrl: './barcode-generator.component.html',
  styleUrls: ['./barcode-generator.component.css']
})
export class BarcodeGeneratorComponent {
  @ViewChildren('barcodeCanvas') barcodeCanvases!: QueryList<ElementRef>;

  products: Product[] = [
    { name: 'Product 1', code: 'P001' },
    { name: 'Product 2', code: 'P002' },
    { name: 'Product 3', code: 'P003' }
  ];

  // Form fields
  companyName: string = 'Abc Company'; // Prefilled with default company name
  count: string = ''; // User input count
  lot: string = ''; // User input lot number
  selectedDate: string = ''; // Date selected by the user
  selectedProductCode: string = '';
  numberOfBarcodes: number = 1; // Number of barcodes to generate
  generatedBarcodes: string[] = []; // Store generated barcodes
  barcodeCounts: BarcodeCount[] = []; // Store barcode counts by product
  barcodesGenerated: boolean = false;

  constructor() {
    // Load the last barcode number for each product from localStorage
    this.products.forEach(product => {
      const storedLastNumber = localStorage.getItem(`lastBarcodeNumber-${product.code}`);
      if (storedLastNumber) {
        product.lastNumber = parseInt(storedLastNumber, 10);
      } else {
        product.lastNumber = 0;
      }

      // Initialize barcodeCounts from localStorage
      const storedCount = localStorage.getItem(`barcodeCount-${product.code}`);
      if (storedCount) {
        this.barcodeCounts.push({ productName: product.name, count: parseInt(storedCount, 10) });
      } else {
        this.barcodeCounts.push({ productName: product.name, count: 0 });
      }
    });
  }

  // Generate barcodes based on user input
  generateBarcodes() {
    if (!this.selectedProductCode || this.numberOfBarcodes <= 0 || !this.companyName || !this.count || !this.lot || !this.selectedDate) {
      console.error("Please fill all the required fields!");
      return;
    }

    // Find the selected product
    const selectedProduct = this.products.find(product => product.code === this.selectedProductCode);

    if (!selectedProduct) {
      console.error("Product not found!");
      return;
    }

    // Generate barcodes
    this.generatedBarcodes = [];
    const startNumber = selectedProduct.lastNumber || 0;

    for (let i = 0; i < this.numberOfBarcodes; i++) {
      const barcodeNumber = startNumber + i + 1;
      // Combine all fields into the final barcode format
      const barcodeCode = `${this.companyName}-${selectedProduct.code}-${barcodeNumber.toString().padStart(2, '0')}-${this.count}-${this.lot}-${this.selectedDate}-${this.numberOfBarcodes}`;
      this.generatedBarcodes.push(barcodeCode);
    }

    // Update the last barcode number for the selected product
    selectedProduct.lastNumber = startNumber + this.numberOfBarcodes;
    localStorage.setItem(`lastBarcodeNumber-${selectedProduct.code}`, selectedProduct.lastNumber.toString());

    // Update barcode count and localStorage
    this.updateBarcodeCount(selectedProduct.name, this.numberOfBarcodes);

    // Disable the form after generation
    this.barcodesGenerated = true;

    // Render the barcodes on canvases
    setTimeout(() => this.renderBarcodes(), 0);
  }

  // Update barcode count
  updateBarcodeCount(productName: string, count: number) {
    const countObj = this.barcodeCounts.find(countObj => countObj.productName === productName);
    if (countObj) {
      countObj.count += count;
      localStorage.setItem(`barcodeCount-${this.products.find(p => p.name === productName)!.code}`, countObj.count.toString());
    }
  }

  resetBarcodeGeneration() {
    this.generatedBarcodes = [];
    this.selectedProductCode = '';
    this.numberOfBarcodes = 1;
    this.barcodesGenerated = false;
    this.count = '';
    this.lot = '';
    this.selectedDate = '';
  }

  // Render the barcodes on canvas elements
  renderBarcodes() {
    this.generatedBarcodes.forEach((code, index) => {
      const canvas = document.getElementById(`barcodeCanvas${index}`) as HTMLCanvasElement;
      if (canvas) {
        JsBarcode(canvas, code, {
          format: 'CODE39',
          displayValue: true,
          width: 1, // Narrower lines for smaller size
          height: 30, // Shorter height
          fontSize: 18, // Smaller font size
          background: "#f5f5f5"
        });
      }
    });
  }

  // Generate PDF with all barcodes
// Generate PDF with all barcodes in one column
generatePDF() {
  const doc = new jsPDF();
  const margin = 10;
  const pageWidth = doc.internal.pageSize.width;
  const barcodeHeight = 30; // Height of each barcode
  const barcodeWidth = pageWidth - 2 * margin; // Full page width minus margins

  let y = margin; // Start position for vertical alignment

  // Add barcodes to PDF
  this.generatedBarcodes.forEach((code) => {
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, code, {
      format: 'CODE39',
      displayValue: true,
      width: 1, // Narrower lines for smaller size
      height: barcodeHeight, // Shorter height
      fontSize: 18, // Smaller font size
      background: "#f5f5f5",
    });

    const imgData = canvas.toDataURL('image/png');

    // Add image to PDF
    doc.addImage(imgData, 'PNG', margin, y, barcodeWidth, barcodeHeight);

    // Update y for next barcode
    y += barcodeHeight + margin; // Move down for the next barcode

    // Add new page if needed
    if (y + barcodeHeight + margin > doc.internal.pageSize.height) {
      doc.addPage();
      y = margin; // Reset y position for new page
    }
  });

  doc.save('barcodes.pdf');
}

  // Print barcodes
  printBarcodes() {
    const doc = new jsPDF();
    this.generatePDF();
    window.open(doc.output('bloburl')); // Opens the PDF for printing
  }
}