import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, FormControl } from '@angular/forms';
import * as XLSX from 'xlsx';
import { FileInput } from 'ngx-material-file-input';
import { Subject } from 'rxjs';
import { ListaRegistrosFormatoDados, ListaRegistrosComponent } from '../lista-registros/lista-registros.component';



export interface ItemCompra {
  edital: string
  ata: string
  fornecedor: string
  objeto: string
  situacao: string
  processo: string
  vigencia_inicial: string
  vigencia_final: string
  item: number
  descricao: string
  unidade: string
  quantidade_licitado: number
  valor_licitado: number
  quantidade_saldo: number
  valor_saldo: number
}

@Component({
  selector: 'principal',
  templateUrl: './principal.component.html',
  styleUrls: ['./principal.component.scss']
})
export class PrincipalComponent implements OnInit {

  form: FormGroup;
  dados: Subject<any> = new Subject<any>()
  @ViewChild('lista') lista: ListaRegistrosComponent;

  colunas: ListaRegistrosFormatoDados[] = [
    { nomeCampo: "edital", tituloColuna: "Edital" },
    { nomeCampo: "item", tituloColuna: "Nr Item" },
    { nomeCampo: "descricao", tituloColuna: "Descrição" },
    { nomeCampo: "vigencia_final", tituloColuna: "Vigente até" },
    { nomeCampo: "quantidade_licitado", tituloColuna: "Qt licitado" },
    { nomeCampo: "valor_licitado", tituloColuna: "Vr licitado" },
    { nomeCampo: "quantidade_saldo", tituloColuna: "Qt saldo" }
  ]

  extras: ListaRegistrosFormatoDados[] = [
    { nomeCampo: "unidade", tituloColuna: "Unidade" },
    { nomeCampo: "situacao", tituloColuna: "Situação" },
    { nomeCampo: "processo", tituloColuna: "Processo" },
    { nomeCampo: "ata", tituloColuna: "Ata" },
    { nomeCampo: "fornecedor", tituloColuna: "Fornecedor" },
    { nomeCampo: "objeto", tituloColuna: "Objeto" },
    { nomeCampo: "quantidade_licitado", tituloColuna: "Qt licitado"},
    { nomeCampo: "vigencia_inicial", tituloColuna: "Vigente a partir de: "},
    { nomeCampo: "vigencia_final", tituloColuna: "Vigente até" },
  ]

  constructor(private fb: FormBuilder) { }

  ngOnInit() {
    const limit = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().substr(0, 10)

    this.form = this.fb.group({
      file: [],
      filtro_saldo: new FormControl(1),
      filtro_data: new FormControl(limit)
    })
  }

  async submit() {
    const filtro_data = this.form.value.filtro_data
    const filtro_saldo = +this.form.value.filtro_saldo
    const itens: ItemCompra[] = []

    for (const f of (<FileInput>this.form.value.file).files) {

      await new Promise((a, r) => {
        const reader = new FileReader();
        reader.onload = (e: Event) => {
          const data = new Uint8Array(e.target["result"])
          const workbook = XLSX.read(data, { type: 'array' })
  
  
          const first_sheet_name = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[first_sheet_name]
          const range = worksheet['!ref']
          const [firstCell, lastCell] = range.split(":")
          const lastRow = parseInt(lastCell.replace(/[A-Z]/gi, ''))
  
          var lendo_itens = false
          var edital = ""
          var ata = ""
          var fornecedor = ""
          var objeto = ""
          var situacao = ""
          var processo = ""
          var vigencia_inicial = ""
          var vigencia_final = ""
  
  
          function v(col: string, row: number): string {
            const cell = worksheet[col + row]
            return (cell || { v: "" }).v
          }
  
          for (var row = 1; row <= lastRow; row++) {
  
            if (lendo_itens) {
              const a = v("A", row)
              const c = v("C", row)
  
              if ((a == "") && (c == "")) {
                lendo_itens = false
              } else {
                if (v("A", row) != "") {
                  const saldo = +v("K", row)
                  if (saldo >= filtro_saldo && (filtro_data == "" || !filtro_data || vigencia_final >= filtro_data)) {
                    itens.push({
                      edital, ata, fornecedor, objeto, situacao, processo, vigencia_inicial, vigencia_final,
                      item: +a,
                      descricao: v("C", row),
                      unidade: v("G", row),
                      quantidade_licitado: +v("H", row),
                      valor_licitado: + v("I", row),
                      quantidade_saldo: saldo,
                      valor_saldo: +v("M", row)
                    })
                  }
                }
              }
            } else {
              if (v("A", row) == "Nº Edital/Ofício:") {
                edital = v("E", row)
                ata = v("E", row + 1)
                fornecedor = v("E", row + 2)
                objeto = v("E", row + 3)
                situacao = v("E", row + 4)
  
                processo = v("J", row)
  
                let vigencia = v("J", row + 1)
  
                if (vigencia.length) {
                  let datas_vigencia = vigencia.split(" à ")
  
                  const vigencia1 = datas_vigencia[0].trim().split("/")
                  const vigencia2 = datas_vigencia[1].trim().split("/")
  
                  vigencia_inicial = `${vigencia1[2]}-${vigencia1[1]}-${vigencia1[0]}`
                  vigencia_final = `${vigencia2[2]}-${vigencia2[1]}-${vigencia2[0]}`
  
                } else {
  
                  vigencia_inicial = ""
                  vigencia_final = ""
  
                }
  
              } else if (v("A", row) == "Item") {
                lendo_itens = true
              }
            }
          }

          a()
        }
        reader.readAsArrayBuffer(f);
      
      })

    }

    this.dados.next(itens)
  }

}
