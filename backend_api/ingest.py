import os
import pickle
import numpy as np
from utils.encoder import HashedTfidfEncoder

def chunk_text(text, max_chunk_size=1000):
    """
    Split text into paragraphs, merging them into chunks of roughly max_chunk_size characters.
    """
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    chunks = []
    current_chunk = []
    current_length = 0
    
    for para in paragraphs:
        para_length = len(para)
        # If adding this paragraph exceeds max size, and we already have some text, save current chunk
        if current_length + para_length > max_chunk_size and current_chunk:
            chunks.append("\n\n".join(current_chunk))
            current_chunk = [para]
            current_length = para_length
        else:
            current_chunk.append(para)
            current_length += para_length + 2  # account for double newline join
            
    if current_chunk:
        chunks.append("\n\n".join(current_chunk))
        
    return chunks

def run_ingestion(hr_docs_dir=None, output_dir=None, model_name='all-MiniLM-L6-v2'):
    """
    Loads all .txt files in hr_docs_dir, chunks them, embeds them,
    and writes metadata.pkl and embeddings.npy to output_dir.
    """
    base_dir = os.path.dirname(os.path.abspath(__file__))
    if hr_docs_dir is None:
        hr_docs_dir = os.path.join(base_dir, "hr_docs")
    if output_dir is None:
        output_dir = os.path.join(base_dir, "data")
        
    os.makedirs(output_dir, exist_ok=True)
    
    if not os.path.exists(hr_docs_dir):
        print(f"Error: {hr_docs_dir} directory does not exist.")
        return False
        
    documents = []
    for filename in os.listdir(hr_docs_dir):
        if filename.endswith(".txt"):
            filepath = os.path.join(hr_docs_dir, filename)
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()
                documents.append({
                    "filename": filename,
                    "content": content
                })
            except Exception as e:
                print(f"Error reading file {filename}: {e}")
                
    if not documents:
        print("No documents found to ingest.")
        return False
        
    print(f"Loaded {len(documents)} documents. Processing chunks...")
    
    chunks_metadata = []
    for doc in documents:
        doc_chunks = chunk_text(doc["content"])
        for idx, chunk in enumerate(doc_chunks):
            chunks_metadata.append({
                "text": chunk,
                "source": doc["filename"],
                "chunk_index": idx
            })
            
    print(f"Total chunks created: {len(chunks_metadata)}")
    
    # Initialize sentence transformer
    print(f"Loading embedding model: {model_name}...")
    model = HashedTfidfEncoder(dimension=384)
    
    print("Generating embeddings...")
    chunk_texts = [chunk["text"] for chunk in chunks_metadata]
    embeddings = model.encode(chunk_texts, show_progress_bar=True, convert_to_numpy=True)
    
    # Save files
    embeddings_file = os.path.join(output_dir, "embeddings.npy")
    metadata_file = os.path.join(output_dir, "metadata.pkl")
    
    np.save(embeddings_file, embeddings)
    with open(metadata_file, "wb") as f:
        pickle.dump(chunks_metadata, f)
        
    print(f"Successfully saved embeddings to {embeddings_file}")
    print(f"Successfully saved metadata to {metadata_file}")
    return True

if __name__ == "__main__":
    run_ingestion()
