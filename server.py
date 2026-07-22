import json
import os
from pathlib import Path
from threading import Lock

from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)

MAX_EMOJIS = 5
DEFAULT_LIKES = {'likeCount': 0, 'emojiIndex': 0}
DATA_FILE = Path(os.getenv('LIKES_DATA_FILE', Path(__file__).with_name('likes.json')))
file_lock = Lock()
DEFAULT_CORS_ORIGINS = (
    r'^https?://localhost(:\d+)?$',
    r'^https?://127\.0\.0\.1(:\d+)?$',
)


def get_allowed_origins():
    configured_origins = os.getenv('CORS_ALLOWED_ORIGINS', '')
    origins = [origin.strip() for origin in configured_origins.split(',') if origin.strip()]
    return origins or list(DEFAULT_CORS_ORIGINS)


CORS(app, resources={r'/api/*': {'origins': get_allowed_origins(), 'methods': ['GET', 'POST']}})


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
    temp_file = DATA_FILE.with_name(f'{DATA_FILE.name}.{os.getpid()}.tmp')
    with temp_file.open('w', encoding='utf-8') as file:
        json.dump(data, file, ensure_ascii=False)
        file.flush()
        os.fsync(file.fileno())
    os.replace(temp_file, DATA_FILE)


def load_likes_unlocked():
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


def load_likes():
    with file_lock:
        return load_likes_unlocked()


def apply_likes_action(action):
    with file_lock:
        data = load_likes_unlocked()
        if action == 'like':
            if data['emojiIndex'] < MAX_EMOJIS:
                data['emojiIndex'] += 1
            data['likeCount'] += 1
        else:
            data['emojiIndex'] = 0

        normalized = normalize_likes(data)
        write_likes(normalized)
        return normalized


@app.route('/api/likes', methods=['GET'])
def get_likes():
    return jsonify(load_likes())


@app.route('/api/likes', methods=['POST'])
def update_likes():
    payload = request.get_json(silent=True) or {}
    action = payload.get('action')

    if action not in {'like', 'reset'}:
        return jsonify({'error': 'Invalid action'}), 400

    return jsonify(apply_likes_action(action))


if __name__ == '__main__':
    app.run(
        host=os.getenv('FLASK_HOST', '0.0.0.0'),
        port=int(os.getenv('PORT', '5000')),
        debug=os.getenv('FLASK_DEBUG') == '1'
    )
