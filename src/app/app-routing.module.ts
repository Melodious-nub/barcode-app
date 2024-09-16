import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BarcodeGeneratorComponent } from './barcode-generator/barcode-generator.component';

const routes: Routes = [
  { path: 'barcode-generator', component: BarcodeGeneratorComponent },
  { path: '', redirectTo: '/barcode-generator', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
