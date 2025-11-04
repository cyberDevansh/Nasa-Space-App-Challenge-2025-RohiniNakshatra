import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
})

export type CategoryList = { categories: string[] }
export type CategoryItems = {
  category_name: string
  data: { id: number; labels: string[]; properties: Record<string, unknown> }[]
}

export type DocumentsForEntity = {
  category: string
  name: string
  documents: string[]
}

export type AllDocuments = { documents: string[] }

export type SearchResults = {
  results: { document: string; max_score: number }[]
}

export type SummarizeResponse = {
  query: string
  generated_output: string
  Publication: string[]
}

export async function listCategories() {
  const { data } = await api.get<CategoryList>('/list-categories/')
  return data
}

export async function getCategoryItems(category: string) {
  const { data } = await api.get<CategoryItems>(`/get-category/${encodeURIComponent(category)}/`)
  return data
}

export async function listDocumentsFor(category: string, name: string) {
  const { data } = await api.get<DocumentsForEntity>('/list-documents/', {
    params: { category, name },
  })
  return data
}

export async function listAllDocuments() {
  const { data } = await api.get<AllDocuments>('/list-all-documents/')
  return data
}

export async function getDocument(doc_name: string) {
  const { data } = await api.get<{ document: unknown }>('/get-document/', {
    params: { doc_name },
  })
  return data
}

export type SummariesResponse = { summaries: { name: string; summary: string }[] }

export async function listSummaries() {
  const { data } = await api.get<SummariesResponse>('/list-summaries/')
  return data
}

export async function searchByNodes(search_text: string, top_k = 20) {
  const { data } = await api.get<SearchResults>('/search-by-nodes/', {
    params: { search_text, top_k },
  })
  return data
}

export async function summarizeQuery(query: string) {
  const { data } = await api.post<SummarizeResponse>('/rag/query-and-generate/', { query })
  return data
}


