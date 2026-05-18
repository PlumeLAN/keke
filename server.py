from flask import Flask, jsonify, request
import json
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

DATA_FILE = 'likes.json'

def load_likes():
    """加载点赞数据"""
    try:
        with open(DATA_FILE, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return {'likeCount': 0, 'emojiIndex': 0}

def save_likes(data):
    """保存点赞数据"""
    with open(DATA_FILE, 'w') as f:
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
    action = request.json.get('action')
    
    if action == 'like':
        if data['emojiIndex'] < 5:
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
