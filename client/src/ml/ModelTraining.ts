import * as tf from '@tensorflow/tfjs';
import { PlayerBehaviorData, PlayerMove, CardCombo } from './DataCollection';
import { GameState } from '../types/game';

export interface TrainingData {
  input: {
    gameState: GameState;
    playerHistory: PlayerBehaviorData;
  };
  output: {
    willBluff: boolean;
    willChallenge: boolean;
  };
}

export class ModelTrainer {
  private model: tf.LayersModel;

  constructor() {
    this.model = this.buildModel();
  }

  private buildModel(): tf.LayersModel {
    const model = tf.sequential();
    
    // Input layer for game state and player history features
    model.add(tf.layers.dense({
      inputShape: [20], // Adjust based on feature vector size
      units: 64,
      activation: 'relu'
    }));
    
    model.add(tf.layers.dropout({ rate: 0.2 }));
    
    model.add(tf.layers.dense({
      units: 32,
      activation: 'relu'
    }));
    
    // Output layer for bluff and challenge predictions
    model.add(tf.layers.dense({
      units: 2,
      activation: 'sigmoid'
    }));
    
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });
    
    return model;
  }

  private preprocessData(data: PlayerBehaviorData): tf.Tensor {
    // Convert player data into a normalized feature vector
    const features = [
      data.bluffFrequency,
      data.challengeSuccessRate,
      data.moves.length,
      data.challenges.length,
      // Add more features as needed
    ];
    
    // Normalize features to [0, 1] range
    const normalizedFeatures = features.map(f => 
      f === undefined ? 0 : Math.min(Math.max(f, 0), 1)
    );
    
    return tf.tensor2d([normalizedFeatures], [1, features.length]);
  }

  public async trainModel(trainingData: TrainingData[]): Promise<tf.History> {
    const inputs: number[][] = [];
    const outputs: number[][] = [];
    
    trainingData.forEach(data => {
      const processedInput = this.preprocessData(data.input.playerHistory);
      inputs.push(Array.from(processedInput.dataSync()));
      outputs.push([
        data.output.willBluff ? 1 : 0,
        data.output.willChallenge ? 1 : 0
      ]);
    });
    
    const inputTensor = tf.tensor2d(inputs);
    const outputTensor = tf.tensor2d(outputs);
    
    const history = await this.model.fit(inputTensor, outputTensor, {
      epochs: 50,
      batchSize: 32,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          console.log(`Epoch ${epoch}: loss = ${logs?.loss.toFixed(4)}`);
        }
      }
    });
    
    // Cleanup tensors
    inputTensor.dispose();
    outputTensor.dispose();
    
    return history;
  }

  public async predict(
    gameState: GameState,
    playerData: PlayerBehaviorData
  ): Promise<{ bluffProbability: number; challengeProbability: number }> {
    const input = this.preprocessData(playerData);
    const prediction = this.model.predict(input) as tf.Tensor;
    const [bluffProb, challengeProb] = Array.from(prediction.dataSync());
    
    // Cleanup tensors
    input.dispose();
    prediction.dispose();
    
    return {
      bluffProbability: bluffProb,
      challengeProbability: challengeProb
    };
  }

  public async saveModel(): Promise<void> {
    await this.model.save('localstorage://bluff-ai-model');
  }

  public async loadModel(): Promise<void> {
    try {
      this.model = await tf.loadLayersModel('localstorage://bluff-ai-model');
      console.log('Model loaded successfully');
    } catch (error) {
      console.error('Error loading model:', error);
      this.model = this.buildModel();
    }
  }
} 