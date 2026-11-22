import React, { useEffect, useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@material-ui/core';
import { listArticles, removeArticle } from '../../Stores/ReadingLibrary';

export default function ReadingLibrary({ account, onClose }) {
    const [entries, setEntries] = useState([]);
    const [query, setQuery] = useState('');
    const [selected, select] = useState(null);
    const [error, setError] = useState('');
    useEffect(() => {
        const refresh = () => {
            try { setEntries(listArticles(account)); setError(''); }
            catch { setEntries([]); setError('No se ha podido abrir el almacenamiento de esta cuenta.'); }
        };
        refresh();
        window.addEventListener('storage', refresh);
        return () => window.removeEventListener('storage', refresh);
    }, [account]);
    const article = entries.find(item => item.url === selected);
    const matches = entries.filter(item => (item.title + ' ' + item.url).toLowerCase().includes(query.trim().toLowerCase()));
    function remove() {
        try {
            removeArticle(account, selected);
            setEntries(listArticles(account));
            select(null);
        } catch { setError('No se ha podido quitar el artículo.'); }
    }
    return (
        <Dialog open fullWidth maxWidth='sm' onClose={onClose} aria-labelledby='reading-library-title'>
            <DialogTitle id='reading-library-title'>{article ? article.title : 'Biblioteca de lectura'}</DialogTitle>
            <DialogContent dividers>
                {error && <p role='alert'>{error}</p>}
                {article ? <article style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{article.text}</article> : <>
                    <TextField fullWidth label='Buscar por título o dirección' value={query} onChange={e => setQuery(e.target.value)} />
                    {matches.map(item => <p key={item.url}><Button onClick={() => select(item.url)}>{item.title}</Button></p>)}
                    {!matches.length && !error && <p>{entries.length ? 'Sin resultados.' : 'Abre un artículo en modo lectura y pulsa Guardar texto.'}</p>}
                </>}
            </DialogContent>
            <DialogActions>
                {article && <><Button onClick={() => select(null)}>Volver</Button>
                    <Button href={article.url} target='_blank' rel='noopener noreferrer'>Abrir original</Button>
                    <Button onClick={remove}>Quitar de la biblioteca</Button></>}
                <Button onClick={onClose}>Cerrar</Button>
            </DialogActions>
        </Dialog>
    );
}
