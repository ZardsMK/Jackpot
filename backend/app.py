import itertools
import random
from flask import Flask, jsonify, request
from flask_cors import CORS
from routes.data_routes import data_bp 

app = Flask(__name__)
CORS(app)

class Player:
    def __init__(self, balance = 1000.0):
        self.balance = float(balance)


class CasaNiquel:

    def __init__(self, level = 1, balance = 10000.0):

        self.SIMBOLOS = {
            'sad_face': '1F972',
            'happy_cat': '1F63A',
            'star_face': '1F929',
            'love_cat': '1F63B',
            'money_face': '1F911'
        }

        self.VALORES_BASE = {
            'sad_face': 0.5,
            'happy_cat': 1.5,
            'star_face': 2,
            'love_cat': 2.5,
            'money_face': 3
        }

        self.level = level
        self.permutations = self._gen_permutation()
        self.balance = float(balance)

    def _gen_permutation(self):
        permutations = list(itertools.product(self.SIMBOLOS.keys(), repeat=5))
        for _ in range(self.level):
            for symbol in self.SIMBOLOS.keys():
                permutations.append((symbol, symbol, symbol))
        return permutations

    def _get_final_result(self):
        result = list(random.choice(self.permutations))

        if len(set(result)) == 5 and random.randint(0, 5) >= 4:
            result[1] = result[0]

        return result

    def _calculate_payout(self, result, amount_bet):
        symbol_counts = {}
        total_win = 0

        for symbol in result:
            if symbol in symbol_counts:
                symbol_counts[symbol] += 1
            else:
                symbol_counts[symbol] = 1

        for symbol, count in symbol_counts.items():
            if count >= 3:
                symbol_value = self.VALORES_BASE[symbol] * amount_bet
                total_win += symbol_value


        return total_win

    def _update_balance(self, amount_bet, result, player: Player):
        payout = self._calculate_payout(result, amount_bet)
        if payout > 0:
            self.balance -= payout
            player.balance += payout
            return payout
        else:
            self.balance += amount_bet
            player.balance -= amount_bet
            return 0

    def play(self, amount_bet, player: Player):
        result = self._get_final_result()
        payout = self._update_balance(amount_bet, result, player)
        return result, payout

maq1 = CasaNiquel(level=1)
p1 = Player()

@app.route('/play', methods=['POST'])
def play_game():
    data = request.json
    amount_bet = float(data.get('bet', 0))

    if amount_bet <= 0 or amount_bet > p1.balance:
        return jsonify({"error": "Saldo insuficiente"}), 400

    result, payout = maq1.play(amount_bet, p1)

    return jsonify({
        "result": [chr(int(maq1.SIMBOLOS[symbol], 16)) for symbol in result],
        "payout": round(payout, 2),
        "player_balance": round(p1.balance, 2),
        "machine_balance": round(maq1.balance, 2)
    })

@app.route('/start', methods=['POST'])
def start_game():
    global p1
    data = request.json
    balance = data.get('balance')
    if balance is not None:
        p1.balance = float(balance)
    return jsonify({"balance": round(p1.balance, 2)})

@app.route('/symbols', methods=['GET'])
def get_symbols():
    return jsonify({symbol: value for symbol, value in maq1.VALORES_BASE.items()})

if __name__ == '__main__':
    app.run(debug=True)