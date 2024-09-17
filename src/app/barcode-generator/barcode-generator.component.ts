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

  selectedProductCode: string = '';
  numberOfBarcodes: number = 1;
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
    if (!this.selectedProductCode || this.numberOfBarcodes <= 0) {
      console.error("Invalid product code or number of barcodes!");
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
      const barcodeCode = `${selectedProduct.code}-${barcodeNumber.toString().padStart(2, '0')}`;
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
          height: 25, // Shorter height
          fontSize: 10, // Smaller font size
          background: "#f5f5f5"
        });
      }
    });
  }

  // Generate PDF with all barcodes
  generatePDF() {
    const doc = new jsPDF();
    const margin = 10;
    const pageWidth = doc.internal.pageSize.width;
    const colWidth = (pageWidth - 3 * margin) / 2; // Two columns with margins
    let x = margin;
    let y = margin;
    const barcodeHeight = 25; // Adjust height for smaller barcode
    const barcodeWidth = colWidth - margin; // Adjust width for smaller barcode

    // Add barcodes to PDF
    this.generatedBarcodes.forEach((code, index) => {
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, code, {
        format: 'CODE39',
        displayValue: true,
        width: 1, // Narrower lines for smaller size
        height: barcodeHeight, // Shorter height
        fontSize: 12, // Smaller font size
        background: "#f5f5f5",
      });

      const imgData = canvas.toDataURL('image/png');

      // Add image to PDF
      doc.addImage(imgData, 'PNG', x, y, barcodeWidth, barcodeHeight);

      // Update x and y for next barcode
      if (index % 2 === 0) {
        x += colWidth; // Move to the next column
      } else {
        x = margin; // Reset to the first column
        y += barcodeHeight + margin; // Move to the next row
      }

      // Add new page if needed
      if (y + barcodeHeight + margin > doc.internal.pageSize.height) {
        doc.addPage();
        x = margin;
        y = margin;
      }
    });

    doc.save('barcodes.pdf');
  }


  // Generate PDF and automatically trigger print dialog
  printBarcodes() {
    const doc = new jsPDF();
    const margin = 10;
    const pageWidth = doc.internal.pageSize.width;
    const colWidth = (pageWidth - 3 * margin) / 2; // Two columns with margins
    let x = margin;
    let y = margin;
    const barcodeHeight = 25; // Adjust height for smaller barcode
    const barcodeWidth = colWidth - margin; // Adjust width for smaller barcode

    // Add barcodes to PDF
    this.generatedBarcodes.forEach((code, index) => {
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, code, {
        format: 'CODE39',
        displayValue: true,
        width: 1, // Narrower lines for smaller size
        height: barcodeHeight, // Shorter height
        fontSize: 12, // Smaller font size
        background: "#f5f5f5",
      });

      const imgData = canvas.toDataURL('image/png');

      // Add image to PDF
      doc.addImage(imgData, 'PNG', x, y, barcodeWidth, barcodeHeight);

      // Update x and y for next barcode
      if (index % 2 === 0) {
        x += colWidth; // Move to the next column
      } else {
        x = margin; // Reset to the first column
        y += barcodeHeight + margin; // Move to the next row
      }

      // Add new page if needed
      if (y + barcodeHeight + margin > doc.internal.pageSize.height) {
        doc.addPage();
        x = margin;
        y = margin;
      }
    });

    // Open the print dialog for the generated PDF
    doc.autoPrint();  // This triggers the print dialog automatically
    window.open(doc.output('bloburl'));  // Opens the PDF in a new tab and directly prints it
  }
}