import importlib
import os
import tempfile
import unittest
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path


class LikesApiTests(unittest.TestCase):
    def setUp(self):
        self.temporary_directory = tempfile.TemporaryDirectory()
        self.data_file = Path(self.temporary_directory.name) / 'likes.json'
        self.previous_data_file = os.environ.get('LIKES_DATA_FILE')
        os.environ['LIKES_DATA_FILE'] = str(self.data_file)

        import server

        self.server = importlib.reload(server)
        self.client = self.server.app.test_client()

    def tearDown(self):
        if self.previous_data_file is None:
            os.environ.pop('LIKES_DATA_FILE', None)
        else:
            os.environ['LIKES_DATA_FILE'] = self.previous_data_file
        self.temporary_directory.cleanup()

    def test_like_and_reset(self):
        self.assertEqual(self.client.get('/api/likes').get_json(), {'likeCount': 0, 'emojiIndex': 0})

        for expected_count in range(1, 7):
            response = self.client.post('/api/likes', json={'action': 'like'})
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.get_json()['likeCount'], expected_count)

        self.assertEqual(
            self.client.get('/api/likes').get_json(),
            {'likeCount': 6, 'emojiIndex': self.server.MAX_EMOJIS},
        )
        self.assertEqual(
            self.client.post('/api/likes', json={'action': 'reset'}).get_json(),
            {'likeCount': 6, 'emojiIndex': 0},
        )

    def test_invalid_action_does_not_change_state(self):
        response = self.client.post('/api/likes', json={'action': 'invalid'})

        self.assertEqual(response.status_code, 400)
        self.assertEqual(self.client.get('/api/likes').get_json(), {'likeCount': 0, 'emojiIndex': 0})

    def test_concurrent_likes_are_not_lost_in_one_process(self):
        with ThreadPoolExecutor(max_workers=8) as executor:
            list(executor.map(lambda _: self.server.apply_likes_action('like'), range(32)))

        self.assertEqual(
            self.client.get('/api/likes').get_json(),
            {'likeCount': 32, 'emojiIndex': self.server.MAX_EMOJIS},
        )
