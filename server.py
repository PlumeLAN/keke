import json
import os
from pathlib import Path
from threading import Lock

from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

MAX_EMOJIS = 5
DEFAULT_LIKES = {'likeCount': 0, 'emojiIndex': 0}
DATA_FILE = Path(os.getenv('LIKES_DATA_FILE', Path(__file__).with_name('likes.json')))
file_lock = Lock()


def normalize_likes(data):
    if not isinstance(data, dict):
        return DEFAULT_LIKES.copy()

    like_count = data.get('likeCount', 0)
    emoji_index = data.get('emojiIndex', 0)

    if not isinstance(like_count, int) or like_count < 0:
        like_count = 0
    if not isinstance(emoji_index, int) or emoji_index < 0:
        emoji_index = 0

    return {
        'likeCount': like_count,
        'emojiIndex': min(emoji_index, MAX_EMOJIS)
    }


def write_likes(data):
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    temp_file = DATA_FILE.with_suffix('.tmp')
    temp_file.write_text(json.dumps(data), encoding='utf-8')
    temp_file.replace(DATA_FILE)


def load_likes():
    with file_lock:
        try:
            raw_data = json.loads(DATA_FILE.read_text(encoding='utf-8'))
            normalized = normalize_likes(raw_data)
            if normalized != raw_data:
                write_likes(normalized)
            return normalized
        except (FileNotFoundError, json.JSONDecodeError, OSError, TypeError, ValueError):
            fallback = DEFAULT_LIKES.copy()
            write_likes(fallback)
            return fallback


def save_likes(data):
    normalized = normalize_likes(data)
    with file_lock:
        write_likes(normalized)
    return normalized


@app.route('/api/likes', methods=['GET'])
def get_likes():
    return jsonify(load_likes())


@app.route('/api/likes', methods=['POST'])
def update_likes():
    data = load_likes()
    payload = request.get_json(silent=True) or {}
    action = payload.get('action')

    if action == 'like':
        if data['emojiIndex'] < MAX_EMOJIS:
            data['emojiIndex'] += 1
        data['likeCount'] += 1
    elif action == 'reset':
        data['emojiIndex'] = 0
    else:
        return jsonify({'error': 'Invalid action'}), 400

    return jsonify(save_likes(data))


if __name__ == '__main__':
    app.run(
        host=os.getenv('FLASK_HOST', '0.0.0.0'),
        port=int(os.getenv('PORT', '5000')),
        debug=os.getenv('FLASK_DEBUG') == '1'
    )
