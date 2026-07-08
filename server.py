from flask import Flask, jsonify, request
import json
from pathlib import Path
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

BASE_DIR = Path(__file__).resolve().parent
DATA_FILE = BASE_DIR / 'likes.json'
LAST_EMOJI_INDEX = 5
DEFAULT_LIKES = {'likeCount': 0, 'emojiIndex': 0}

def load_likes():
    """加载点赞数据"""
    try:
        with DATA_FILE.open('r', encoding='utf-8') as f:
            data = json.load(f)
            like_count = int(data.get('likeCount', 0))
            emoji_index = int(data.get('emojiIndex', 0))
            return {
                'likeCount': max(like_count, 0),
                'emojiIndex': min(max(emoji_index, 0), LAST_EMOJI_INDEX)
            }
    except (FileNotFoundError, json.JSONDecodeError, TypeError, ValueError):
        return DEFAULT_LIKES.copy()

def save_likes(data):
    """保存点赞数据"""
    with DATA_FILE.open('w', encoding='utf-8') as f:
        json.dump(data, f)

@app.route('/api/likes', methods=['GET'])
def get_likes():
    """获取点赞数据"""
    data = load_likes()
    return jsonify(data)

@app.route('/api/likes', methods=['POST'])
def update_likes():
    """更新点赞数据"""
    data = load_likes()
    payload = request.get_json(silent=True) or {}
    action = payload.get('action')
    
    if action == 'like':
        if data['emojiIndex'] < LAST_EMOJI_INDEX:
            data['emojiIndex'] += 1
        data['likeCount'] += 1
    elif action == 'reset':
        data['emojiIndex'] = 0
    else:
        return jsonify({'error': 'Invalid action'}), 400
    
    save_likes(data)
    return jsonify(data)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
