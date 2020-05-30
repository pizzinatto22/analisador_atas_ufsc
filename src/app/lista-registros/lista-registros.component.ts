import { Component, Input, ViewChild, OnInit, OnDestroy } from '@angular/core'
import { MatPaginator } from '@angular/material/paginator'
import { MatTableDataSource } from '@angular/material/table'
import { MatSort } from '@angular/material/sort'
import { Subscription, Subject } from 'rxjs'


export interface ListaRegistrosFormatoDados {
  tituloColuna: string
  nomeCampo: string
}

@Component({
  selector: 'lista-registros',
  templateUrl: './lista-registros.component.html',
  styleUrls: ['./lista-registros.component.scss']
})
export class ListaRegistrosComponent implements OnInit, OnDestroy {

  @Input() itensPorPagina: number[] = [100, 500, 1000, 10000]
  @Input() colunas: ListaRegistrosFormatoDados[] = []
  @Input() camposExpandidos: ListaRegistrosFormatoDados[] = []
  @Input() dados: Subject<any>
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator
  @ViewChild(MatSort, { static: true }) sort: MatSort

  dataSource: MatTableDataSource<any>

  private subscription: Subscription

  ngOnInit() {
    this.subscription = this.dados.subscribe(data => {
      this.dataSource = new MatTableDataSource<any>(data)
      this.dataSource.paginator = this.paginator
      this.dataSource.sort = this.sort;
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  campos() {
    return this.colunas.map(c => c.nomeCampo)
  }

  more(r) {
    r.mostrar_detalhes = !("mostrar_detalhes" in r) || !r.mostrar_detalhes ? true : false
  }

}
