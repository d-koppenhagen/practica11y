import { TreeGenerator } from './tree';
import { getRole, computeAccessibleName } from 'dom-accessibility-api';

vi.mock('dom-accessibility-api', () => ({
  getRole: vi.fn(),
  computeAccessibleName: vi.fn(),
}));

const mockedGetRole = vi.mocked(getRole);
const mockedComputeAccessibleName = vi.mocked(computeAccessibleName);

describe('TreeGenerator', () => {
  let generator: TreeGenerator;

  beforeEach(() => {
    generator = new TreeGenerator();
    vi.clearAllMocks();
  });

  describe('simple DOM → correct tree with roles and names', () => {
    it('should generate a tree node with role and name from a simple element', () => {
      const el = document.createElement('button');
      el.textContent = 'Submit';

      mockedGetRole.mockReturnValue('button');
      mockedComputeAccessibleName.mockReturnValue('Submit');

      const result = generator.generate(el);

      expect(result.role).toBe('button');
      expect(result.name).toBe('Submit');
      expect(result.children).toEqual([
        { role: 'StaticText', name: 'Submit', children: [] },
      ]);
    });
  });

  describe('heading elements → correct level assignment (1-6)', () => {
    it.each([1, 2, 3, 4, 5, 6])(
      'should assign level %i for h%i element',
      (level) => {
        const el = document.createElement(`h${level}`);

        mockedGetRole.mockReturnValue('heading');
        mockedComputeAccessibleName.mockReturnValue('');

        const result = generator.generate(el);

        expect(result.role).toBe('heading');
        expect(result.level).toBe(level);
      },
    );

    it('should not assign a level to non-heading elements', () => {
      const el = document.createElement('div');

      mockedGetRole.mockReturnValue('generic');
      mockedComputeAccessibleName.mockReturnValue('');

      const result = generator.generate(el);

      expect(result.level).toBeUndefined();
    });
  });

  describe('role="none" elements are filtered', () => {
    it('should exclude children with role "none" from the tree', () => {
      const parent = document.createElement('div');
      const child1 = document.createElement('span');
      const child2 = document.createElement('span');
      parent.appendChild(child1);
      parent.appendChild(child2);

      mockedGetRole.mockImplementation((el) => {
        if (el === parent) return 'generic';
        if (el === child1) return 'none';
        if (el === child2) return 'text';
        return null;
      });
      mockedComputeAccessibleName.mockReturnValue('');

      const result = generator.generate(parent);

      expect(result.children).toHaveLength(1);
      expect(result.children[0].role).toBe('text');
    });
  });

  describe('role="presentation" elements are also filtered', () => {
    it('should exclude children with role "presentation" from the tree', () => {
      const parent = document.createElement('div');
      const child1 = document.createElement('span');
      const child2 = document.createElement('span');
      parent.appendChild(child1);
      parent.appendChild(child2);

      mockedGetRole.mockImplementation((el) => {
        if (el === parent) return 'generic';
        if (el === child1) return 'presentation';
        if (el === child2) return 'link';
        return null;
      });
      mockedComputeAccessibleName.mockReturnValue('');

      const result = generator.generate(parent);

      expect(result.children).toHaveLength(1);
      expect(result.children[0].role).toBe('link');
    });
  });

  describe('nested DOM → correct tree depth', () => {
    it('should generate a tree with correct nesting depth', () => {
      const grandparent = document.createElement('div');
      const parent = document.createElement('nav');
      const child = document.createElement('a');
      grandparent.appendChild(parent);
      parent.appendChild(child);

      mockedGetRole.mockImplementation((el) => {
        if (el === grandparent) return 'generic';
        if (el === parent) return 'navigation';
        if (el === child) return 'link';
        return null;
      });
      mockedComputeAccessibleName.mockImplementation((el) => {
        if (el === child) return 'Home';
        return '';
      });

      const result = generator.generate(grandparent);

      expect(result.role).toBe('generic');
      expect(result.children).toHaveLength(1);
      expect(result.children[0].role).toBe('navigation');
      expect(result.children[0].children).toHaveLength(1);
      expect(result.children[0].children[0].role).toBe('link');
      expect(result.children[0].children[0].name).toBe('Home');
      expect(result.children[0].children[0].children).toEqual([]);
    });
  });

  describe('element without accessible name → name is omitted', () => {
    it('should not include name property when computeAccessibleName returns empty string', () => {
      const el = document.createElement('div');

      mockedGetRole.mockReturnValue('generic');
      mockedComputeAccessibleName.mockReturnValue('');

      const result = generator.generate(el);

      expect(result.name).toBeUndefined();
      expect(result).not.toHaveProperty('name');
    });
  });
});
