# Contributing Guidelines

## How to Contribute

We welcome contributions! Please follow these guidelines:

### 1. Fork the Repository
```bash
git clone https://github.com/yourusername/plagiarism-checker.git
cd plagiarism-checker
```

### 2. Create a Feature Branch
```bash
git checkout -b feature/your-feature-name
```

### 3. Make Changes
- Follow the existing code style
- Add comments for complex logic
- Write meaningful commit messages

### 4. Commit Your Changes
```bash
git add .
git commit -m "Add: Description of your changes"
```

### 5. Push to Your Fork
```bash
git push origin feature/your-feature-name
```

### 6. Create a Pull Request
- Go to GitHub and create a pull request
- Describe your changes clearly
- Link any related issues

## Code Style Guidelines

### JavaScript/Node.js
```javascript
// Use const by default, let if needed
const variable = 'value';

// Use arrow functions
const myFunction = (param) => {
  return param * 2;
};

// Use descriptive names
const getUserById = async (id) => {
  // implementation
};
```

### React
```javascript
// Use functional components
const MyComponent = () => {
  const [state, setState] = useState(null);

  return (
    <div className="component-name">
      {/* JSX here */}
    </div>
  );
};
```

### CSS
```css
/* Use meaningful class names */
.component-name {
  /* styles */
}

.component-name__element {
  /* BEM naming convention */
}

.component-name--modifier {
  /* modifiers */
}
```

## Commit Message Format

```
Type: Description

- Additional details if needed
- More information about changes

Fixes #issue-number (if applicable)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Tests
- `chore`: Build, dependencies, etc.

## Testing

Before submitting a PR, please:
1. Test your changes locally
2. Run the application
3. Test different user roles
4. Check responsive design

## Reporting Issues

When reporting issues, please include:
- Description of the issue
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment (OS, browser, etc.)

## Code Review

- All PRs require review
- Maintain clean commit history
- Update documentation if needed
- Ensure tests pass

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

Feel free to open an issue for questions or discussion.

Thank you for contributing!
