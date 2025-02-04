import React, { useState, useEffect } from "react";
import '../css/Body.css';

export default function Body() {
    const [, setData] = useState([]);
    const [animatedSymbols, setAnimatedSymbols] = useState([]);
    const [spinning, setSpinning] = useState(true);
    const [playerBalance, setPlayerBalance] = useState(0);
    const [betValue, setBetValue] = useState("");
    const [depositValue, setDepositValue] = useState("");
    const [payout, setPayout] = useState(0);
    const [showInfoModal, setShowInfoModal] = useState(false);

    const baseSymbolValues = {
        '🥲': 2,
        '😺': 3,
        '🤩': 5,
        '😻': 8,
        '🤑': 10
    };

    useEffect(() => {
        fetch('http://127.0.0.1:5000/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ balance: 0 })
        })
        .then((response) => response.json())
        .then((result) => setPlayerBalance(result.balance))
        .catch((error) => console.error('Erro ao buscar saldo inicial:', error));
    }, []);

    useEffect(() => {
        fetch('http://127.0.0.1:5000/api/data')
          .then((response) => response.json())
          .then((result) => {
            if (Array.isArray(result)) {
                setData(result);
            } else {
                console.error('API não retornou um array:', result);
                setData([]);
            }
        })
          .catch((error) => {
            console.error('Erro ao buscar dados:', error);
            setData([]);
        });
    }, []);

    useEffect(() => {
        let interval;
    
        if (spinning) {
            interval = setInterval(() => {
                const symbols = Object.keys(baseSymbolValues);
                const newSymbols = Array(5).fill().map(() => symbols[Math.floor(Math.random() * symbols.length)]);
                setAnimatedSymbols(newSymbols);
            }, 200);
        }

        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [spinning]);

    const playGame = () => {
        const bet = parseFloat(betValue);
        if (isNaN(bet) || bet <= 0 || bet > playerBalance) {
            alert('Aposta inválida!');
            return;
        }

        setSpinning(true);
        
        fetch('http://127.0.0.1:5000/play', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bet }),
        })
        .then((response) => response.json())
        .then((result) => {
            setTimeout(() => { 
                setAnimatedSymbols(result.result); 
                setSpinning(false);
                setPlayerBalance((prevBalance) => prevBalance - bet + result.payout);
                setPayout(result.payout);
            }, 1000);
        })
        .catch((error) => console.error('Erro ao jogar:', error));
    };

    const handleDeposit = () => {
        const depositAmount = parseFloat(depositValue);
        if (isNaN(depositAmount) || depositAmount <= 0) {
            alert("Por favor, insira um valor válido para o depósito.");
            return;
        }

        fetch('http://127.0.0.1:5000/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ balance: playerBalance + depositAmount })
        })
        .then((response) => response.json())
        .then((result) => setPlayerBalance(result.balance))
        .catch((error) => console.error('Erro ao depositar:', error));

        setDepositValue('');
    };

    const getUpdatedSymbolValues = () => {
        const bet = parseFloat(betValue);
        if (isNaN(bet) || bet <= 0) {
            return baseSymbolValues; 
        }

        let updatedValues = {};
        for (let symbol in baseSymbolValues) {
            updatedValues[symbol] = baseSymbolValues[symbol] * bet;
        }
        return updatedValues;
    };

    return (
        <div>
            <div className="container mt-4">
                <h2 className="text-center">Resultados da Máquina</h2>

                <div className="slot-machine">
                    <div className="reel-container">
                        {animatedSymbols?.length > 0 ? (
                            animatedSymbols.map((symbol, index) => (
                                <div className="reel" key={index}>{symbol}</div>
                            ))
                        ) : (
                            <p>Carregando símbolos...</p>
                        )}
                    </div>
                </div>

                <div className="balance-info">
                    <h3>Saldo Atual: ${playerBalance.toFixed(2)}</h3>
                    <h3>Pagamento: ${payout.toFixed(2)}</h3>
                </div>

                <div className="container-bottom">
                    <div className="container-input mb-3">
                        <h4>Aposta</h4>
                        <input
                            type="text"
                            className="form-control mb-2"
                            placeholder="Valor da Aposta"
                            value={betValue}
                            onChange={(e) => setBetValue(e.target.value.replace(",", "."))}
                        />
                        <h4>Depósito</h4>
                        <input
                            type="text"
                            className="form-control mb-2"
                            placeholder="Valor do Depósito"
                            value={depositValue}
                            onChange={(e) => setDepositValue(e.target.value.replace(",", "."))}
                        />
                        <button className="btn btn-primary" onClick={handleDeposit}>
                            Depositar
                        </button>
                    </div>
                    <div className="buttons-container">
                        <button className="btn btn-info small-button" onClick={() => setShowInfoModal(true)}>
                            ℹ️
                        </button>
                        <button className="btn btn-success" onClick={playGame} >
                            Apostar
                        </button>

                    </div>
                </div>

                {showInfoModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h2 className="modal-title">Regras do Jogo</h2>
                            <p>➡️ A cada rodada, você pode apostar um valor.</p>
                            <p>➡️ Se os símbolos coincidirem, você ganha um payout maior!</p>
                            <p>➡️ Gerencie bem seu saldo e divirta-se!</p>

                            <h3 className="symbol-title">Valores dos Símbolos:</h3>
                            <div className="symbol-values">
                                {Object.entries(getUpdatedSymbolValues()).map(([symbol, value]) => (
                                    <p key={symbol} className="symbol-item">
                                        {symbol} - ${value.toFixed(2)}
                                    </p>
                                ))}
                            </div>

                            <button className="btn btn-danger" onClick={() => setShowInfoModal(false)}>
                                Fechar
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
