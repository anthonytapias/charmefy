import { Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BaseLayout } from '../components/layout';
import './HomePage.css';

const HomePage = () => {
  const categories = ['All', 'Girls', 'Anime', 'Guys'];

  const characters = [
    {
      id: 1,
      name: 'Jemma',
      image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=500&fit=crop',
      tags: ['Friend', 'GL', '26', 'Lesbian', 'Cute']
    },
    {
      id: 2,
      name: 'Amelia',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=500&fit=crop',
      tags: ['Your Boss', 'Seductive', '32']
    },
    {
      id: 3,
      name: 'Sanisha Mander',
      image: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=400&h=500&fit=crop',
      tags: ['Teacher', '24', 'Teasing', 'Charming']
    },
    {
      id: 4,
      name: 'Heather',
      image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=500&fit=crop',
      tags: ['Nurse', '27', 'Seductive', 'Patient']
    },
    {
      id: 5,
      name: 'Emma Thompson',
      image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=500&fit=crop',
      tags: ['Neighbor', '25', 'Friendly', 'Sweet']
    },
    {
      id: 6,
      name: 'Create Companion',
      image: null,
      isCreateCard: true
    },
    {
      id: 7,
      name: 'Amanda Black',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop',
      tags: ['Artist', '29', 'Creative', 'Bold']
    },
    {
      id: 8,
      name: 'Jessica Johnson',
      image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=500&fit=crop',
      tags: ['Cheerleader', '22', 'Energetic', 'Fun']
    }
  ];

  return (
    <BaseLayout>
      <div className="homepage">
        <div className="category-tabs">
          {categories.map((category, index) => (
            <button
              key={index}
              className={`category-tab ${index === 0 ? 'active' : ''}`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="characters-grid">
          {characters.map((character) => (
            character.isCreateCard ? (
              <Link key={character.id} to="/create" className="character-card create-card">
                <div className="create-card-content">
                  <Sparkles className="sparkle-icon" size={24} />
                  <h3>Create your</h3>
                  <h2>Dream Companion</h2>
                </div>
              </Link>
            ) : (
              <Link key={character.id} to={`/chat/${character.id}`} className="character-card">
                <img
                  src={character.image}
                  alt={character.name}
                  className="character-image"
                />
                <div className="character-overlay">
                  <h3 className="character-name">{character.name}</h3>
                  <div className="character-tags">
                    {character.tags?.map((tag, index) => (
                      <span key={index} className="tag">{tag}</span>
                    ))}
                  </div>
                </div>
              </Link>
            )
          ))}
        </div>
      </div>
    </BaseLayout>
  );
};

export default HomePage;
